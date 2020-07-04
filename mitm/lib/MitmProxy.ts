import net, { ListenOptions, Socket } from 'net';
import http, { IncomingMessage } from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import CertificateAuthority from './CertificateAuthority';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import IMitmProxyOptions from '../interfaces/IMitmProxyOptions';
import Queue from '@secret-agent/commons/Queue';
import MitmRequestHandler from './MitmRequestHandler';
import Log from '@secret-agent/commons/Logger';
import HttpResponseCache from './HttpResponseCache';
import RequestSession from '../handlers/RequestSession';

const { log } = Log(module);

/**
 * This module is heavily inspired by 'https://github.com/joeferner/node-http-mitm-proxy'
 */
export default class MitmProxy {
  public static responseCache = new HttpResponseCache();
  public options: IMitmProxyOptions;
  public httpServer: http.Server;

  public get port() {
    return this.httpPort;
  }

  public get httpPort() {
    return (this.httpServer.address() as net.AddressInfo).port;
  }

  public get httpsPort() {
    return (this.httpsServer.address() as net.AddressInfo).port;
  }

  private httpHost: string;
  private httpsServer: https.Server;

  private secureContextCreationQueue: { [host: string]: Queue } = {};
  private secureContexts: {
    [name: string]: boolean;
  } = {};
  private sslCaDir: string;
  private ca: CertificateAuthority;

  constructor() {
    this.httpServer = http.createServer();
    this.httpServer.on('connect', this.handleHttpServerConnect.bind(this));
    this.httpServer.on('request', this.onHttpRequest.bind(this, false));
    this.httpServer.on('upgrade', this.onHttpUpgrade.bind(this, false));

    this.httpsServer = https.createServer();
    this.httpsServer.on('clientError', this.handleHttpError.bind(this, 'HTTPS_CLIENT_ERROR', null));
    this.httpsServer.on('connect', this.handleHttpServerConnect.bind(this));
    this.httpsServer.on('request', this.onHttpRequest.bind(this, true));
    this.httpsServer.on('upgrade', this.onHttpUpgrade.bind(this, true));
  }

  public async listen(options: IMitmProxyOptions) {
    this.options = options || {};
    this.httpHost = options.host;

    this.sslCaDir = options.sslCaDir || path.resolve(process.cwd(), '.mitm-ca');

    this.ca = await CertificateAuthority.create(this.sslCaDir);

    await startServer(this.httpServer, {
      host: this.httpHost,
      port: options.port ?? 8080,
    });

    await startServer(this.httpsServer, {
      host: this.httpHost,
      port: options.httpsPort ?? 0,
    });

    // don't listen for errors until server already started
    this.httpServer.on('error', this.handleHttpError.bind(this, 'HTTP_SERVER_ERROR', null));
    this.httpsServer.on('error', this.handleHttpError.bind(this, 'HTTPS_SERVER_ERROR', null));
    return this;
  }

  public async close() {
    if (!this.httpServer) return;
    await closeServer(this.httpServer);
    await closeServer(this.httpsServer);

    delete this.httpServer;
    delete this.httpsServer;
    delete this.secureContexts;

    await RequestSession.close();
    return this;
  }

  public handleHttpError(errorKind: string, ctx: IMitmRequestContext, error: Error) {
    if (ctx?.requestSession) {
      ctx.requestSession.emit('httpError', { request: ctx.clientToProxyRequest, error });
    }
    if (!(error as any)?.isLogged) {
      log.error('MITM Error', { errorKind, error, url: ctx?.url });
    }
    if (ctx?.proxyToClientResponse && !ctx.proxyToClientResponse.headersSent) {
      ctx.proxyToClientResponse.writeHead(504, 'Proxy Error');
    }
    if (ctx?.proxyToClientResponse && !ctx.proxyToClientResponse.finished) {
      ctx.proxyToClientResponse.end(`${errorKind}:${error}`, 'utf8');
    }
  }

  private async onHttpRequest(
    isSecure: boolean,
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ) {
    try {
      const handler = new MitmRequestHandler(
        MitmProxy.responseCache,
        this.handleHttpError.bind(this),
      );
      await handler.handleRequest(isSecure, request, response);
    } catch (err) {
      log.error('MitmHttpRequest.HandlerError', {
        isSecure,
        host: request.headers.host,
        url: request.url,
        err,
      });
    }
  }

  private async onHttpUpgrade(
    isSecure: boolean,
    request: IncomingMessage,
    socket: Socket,
    head: Buffer,
  ) {
    try {
      const handler = new MitmRequestHandler(MitmProxy.responseCache, (errorKind, ctx, error) => {
        if (ctx?.requestSession) {
          ctx.requestSession.emit('httpError', { request: ctx.clientToProxyRequest, error });
        }
        if (!(error as any)?.isLogged) {
          log.error('MITM WebSocket Error', { errorKind, error, url: ctx?.url });
        }
        socket.destroy(error);
      });
      await handler.handleUpgrade(isSecure, request, socket, head);
    } catch (err) {
      log.error('MitmHttpRequest.HandlerError', {
        isSecure,
        host: request.headers.host,
        url: request.url,
        err,
      });
    }
  }

  // Since node 0.9.9, ECONNRESET on sockets are no longer hidden
  private onSocketError(socketDescription: string, err: Error) {
    if ((err as any).errno === 'ECONNRESET') {
      log.info(`Got ECONNRESET on ${socketDescription}, ignoring.`);
    } else {
      this.handleHttpError(`${socketDescription}_ERROR`, null, err);
    }
  }

  private async handleHttpServerConnect(
    req: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ) {
    socket.on('error', this.onSocketError.bind(this, 'CLIENT_TO_PROXY_SOCKET'));

    // we need first byte of data to detect if request is SSL encrypted
    if (!head || head.length === 0) {
      socket.once('data', this.handleHttpServerConnectData.bind(this, req, socket));
      socket.write('HTTP/1.1 200 OK\r\n');
      if (this.options.keepAlive && req.headers['proxy-connection'] === 'keep-alive') {
        socket.write('Proxy-Connection: keep-alive\r\n');
        socket.write('Connection: keep-alive\r\n');
      }
      return socket.write('\r\n');
    }
    await this.handleHttpServerConnectData(req, socket, head);
  }

  private async handleHttpServerConnectData(
    req: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ) {
    socket.pause();

    /*
     * Detect TLS from first bytes of data
     * Inspired from https://gist.github.com/tg-x/835636
     * used heuristic:
     * - an incoming connection using SSLv3/TLSv1 records should start with 0x16
     * - an incoming connection using SSLv2 records should start with the record size
     *   and as the first record should not be very big we can expect 0x80 or 0x00 (the MSB is a flag)
     * - everything else is considered to be unencrypted
     */
    const isTls = head[0] === 0x16 || head[0] === 0x80 || head[0] === 0x00;

    if (!isTls) {
      return this.makeConnection(socket, this.httpPort, head);
    }

    // URL is in the form 'hostname:port'
    const hostname = req.url.split(':', 2)[0];
    const sslServer = this.secureContexts[hostname];
    if (sslServer) {
      return this.makeConnection(socket, this.httpsPort, head);
    }

    // now try wildcard servers
    const wildcardHost = hostname.replace(/[^.]+\./, '*.');
    let queue = this.secureContextCreationQueue[wildcardHost];
    if (!queue) {
      queue = this.secureContextCreationQueue[wildcardHost] = new Queue();
    }
    await queue.run(async () => {
      if (!this.secureContexts[hostname] && this.secureContexts[wildcardHost]) {
        this.secureContexts[hostname] = true;
      }

      if (!this.secureContexts[hostname]) {
        try {
          await this.addHttpsContext(hostname);
        } catch (err) {
          this.handleHttpError('OPEN_HTTPS_SERVER_ERROR', null, err);
        }
      }
      this.makeConnection(socket, this.httpsPort, head);
    });
  }

  private async makeConnection(socket: net.Socket, port: number, head: Buffer) {
    // open a TCP connection to the remote host
    const conn = await new Promise<net.Socket>(resolve => {
      const c = net.connect(
        {
          port: port,
          allowHalfOpen: true,
        },
        () => resolve(c),
      );
    });

    conn.on('error', this.onSocketError.bind(this, 'PROXY_TO_PROXY_SOCKET'));
    // create a tunnel between the two hosts
    conn.on('finish', () => socket.destroy());
    socket.on('close', () => conn.end());

    conn.setNoDelay(true);
    conn.setTimeout(0);
    if (head.length) socket.unshift(head);

    socket.pipe(conn);
    conn.pipe(socket);
    socket.resume();
  }

  private async addHttpsContext(hostname: string) {
    const keyFilePath = `${this.sslCaDir}/keys/${hostname}.key`;
    const certFilePath = `${this.sslCaDir}/certs/${hostname}.pem`;
    const keyFileExists = fs.existsSync(keyFilePath);
    const certFileExists = fs.existsSync(certFilePath);
    let key: Buffer | string;
    let cert: Buffer | string;
    if (keyFileExists && certFileExists) {
      [key, cert] = await Promise.all([
        fs.promises.readFile(keyFilePath),
        fs.promises.readFile(certFilePath),
      ]);
    } else {
      const hosts = [hostname];
      ({ key, cert } = await this.ca.generateServerCertificateKeys(hosts));
    }

    // if host is not an ip, and this is force sni, use shared server
    log.info(`creating SNI context for ${hostname}`);
    this.httpsServer.addContext(hostname, { key, cert });
    this.secureContexts[hostname] = true;
    return this.httpsPort;
  }

  public static async start(
    startingPort?: number,
    shouldFindAvailablePort = true,
  ): Promise<MitmProxy> {
    const proxy = new MitmProxy();
    const port = Number(startingPort) || 20000;
    try {
      await proxy.listen({ port: port, keepAlive: false });
    } catch (error) {
      if (error.code === 'EADDRINUSE' && shouldFindAvailablePort) {
        setTimeout(() => {
          proxy.httpServer.close();
          proxy.httpServer.listen(0);
        }, 1000);
      }
    }
    return proxy;
  }
}

async function startServer(server: http.Server, options: ListenOptions) {
  return await new Promise<number>((resolve, reject) => {
    try {
      server.once('error', reject);
      server.listen(options, () => {
        const port = (server.address() as net.AddressInfo).port;
        resolve(port);
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function closeServer(server: http.Server) {
  return new Promise(resolve => {
    server.close(() => {
      resolve();
    });
  });
}
