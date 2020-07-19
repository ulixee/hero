import net, { ListenOptions, Socket } from 'net';
import http, { IncomingMessage } from 'http';
import https from 'https';
import path from 'path';
import CertificateAuthority from './CertificateAuthority';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import IMitmProxyOptions from '../interfaces/IMitmProxyOptions';
import MitmRequestHandler from './MitmRequestHandler';
import Log from '@secret-agent/commons/Logger';
import HttpResponseCache from './HttpResponseCache';
import RequestSession from '../handlers/RequestSession';
import { parseRawHeaders } from './Utils';

const { log } = Log(module);

/**
 * This module is heavily inspired by 'https://github.com/joeferner/node-http-mitm-proxy'
 */
export default class MitmProxy {
  public static responseCache = new HttpResponseCache();
  public readonly options: IMitmProxyOptions;
  public readonly httpServer: http.Server;

  public get port() {
    return this.httpPort;
  }

  public get httpPort() {
    return (this.httpServer.address() as net.AddressInfo)?.port;
  }

  public get httpsPort() {
    return (this.httpsServer.address() as net.AddressInfo)?.port;
  }

  private readonly httpHost: string;
  private readonly httpsServer: https.Server;

  private secureContexts: {
    [hostname: string]: Promise<void>;
  } = {};
  private readonly sslCaDir: string;
  private ca: CertificateAuthority;

  constructor(options: IMitmProxyOptions) {
    this.options = options || {};
    this.httpHost = options.host;

    this.sslCaDir = options.sslCaDir || path.resolve(process.cwd(), '.mitm-ca');
    this.httpServer = http.createServer();
    this.httpServer.on('connect', this.handleHttpServerConnect.bind(this));
    this.httpServer.on('request', this.onHttpRequest.bind(this, false));
    this.httpServer.on('upgrade', this.onHttpUpgrade.bind(this, false));

    this.httpsServer = https.createServer();
    this.httpsServer.on('clientError', this.handleHttpError.bind(this, 'HTTPS_CLIENT_ERROR', null));
    this.httpsServer.on('request', this.onHttpRequest.bind(this, true));
    this.httpsServer.on('upgrade', this.onHttpUpgrade.bind(this, true));
  }

  public async listen() {
    this.ca = await CertificateAuthority.create(this.sslCaDir);

    await startServer(
      this.httpServer,
      {
        host: this.httpHost,
        port: this.options.port ?? 8080,
      },
      this.options.shouldFindAvailablePort,
    );

    await startServer(
      this.httpsServer,
      {
        host: this.httpHost,
        port: this.options.httpsPort ?? 0,
      },
      this.options.shouldFindAvailablePort,
    );

    // don't listen for errors until server already started
    this.httpServer.on('error', this.handleHttpError.bind(this, 'HTTP_SERVER_ERROR', null));
    this.httpsServer.on('error', this.handleHttpError.bind(this, 'HTTPS_SERVER_ERROR', null));
    return this;
  }

  public async close() {
    await closeServer(this.httpServer);
    await closeServer(this.httpsServer);

    delete this.secureContexts;

    await RequestSession.close();
    return this;
  }

  public handleHttpError(errorKind: string, ctx: IMitmRequestContext, error: Error) {
    if (ctx?.requestSession) {
      ctx.requestSession.emit('httpError', { request: ctx.clientToProxyRequest, error });
    }
    if (!(error as any)?.isLogged) {
      log.error('MitmHttpError', {
        sessionId: ctx?.requestSession?.sessionId,
        errorKind,
        error,
        url: ctx?.url,
      });
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
      const sessionId = RequestSession.getSessionId(request.headers as any, request.method);
      log.error('MitmHttpRequest.HandlerError', {
        sessionId,
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
          log.error('Mitm WebSocket Error', {
            sessionId: ctx?.requestSession?.sessionId,
            errorKind,
            error,
            url: ctx?.url,
          });
        }
        socket.destroy(error);
      });
      await handler.handleUpgrade(isSecure, request, socket, head);
    } catch (error) {
      const sessionLookup = await RequestSession.waitForWebsocketSessionId(
        parseRawHeaders(request.rawHeaders),
        10,
      ).catch();

      log.error('MitmHttpRequest.HandlerError', {
        sessionId: sessionLookup?.sessionId,
        isSecure,
        host: request.headers.host,
        url: request.url,
        error,
      });
    }
  }

  private onConnectError(hostname: string, errorKind: string, error: Error) {
    if ((error as any).errno === 'ECONNRESET') {
      log.info(`Got ECONNRESET on Proxy Connect, ignoring.`, {
        sessionId: null,
        hostname,
      });
    } else {
      log.error('MitmHttpError', {
        sessionId: null,
        errorKind,
        error,
        hostname,
      });
    }
  }

  private async handleHttpServerConnect(
    req: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ) {
    socket.on('error', this.onConnectError.bind(this, req.url, 'CLIENT_TO_PROXY_CONNECT_ERROR'));

    socket.write('HTTP/1.1 200 Connection established\r\n\r\n');
    // we need first byte of data to detect if request is SSL encrypted
    if (!head || head.length === 0) {
      head = await new Promise<Buffer>(resolve => socket.once('data', resolve));
    }

    socket.pause();

    let proxyToProxyPort = this.httpPort;
    // for https we create a new connect back to the https server so we can have the proper cert and see the traffic
    if (MitmProxy.isTlsByte(head)) {
      // URL is in the form 'hostname:port'
      const hostname = req.url.split(':', 2)[0];

      if (!this.secureContexts[hostname]) {
        this.secureContexts[hostname] = this.addSecureContext(hostname);
      }
      await this.secureContexts[hostname];
      proxyToProxyPort = this.httpsPort;
    }

    // for http, we are proxying to clear out the buffer (for websockets in particular)
    // NOTE: this probably can be optimized away for http

    const proxyConnection = net.connect(proxyToProxyPort);
    proxyConnection.on(
      'error',
      this.onConnectError.bind(this, req.url, 'PROXY_TO_PROXY_CONNECT_ERROR'),
    );

    proxyConnection.on('close', () => socket.destroy());
    socket.on('close', () => proxyConnection.end());

    await new Promise(r => proxyConnection.once('connect', r));

    // create a tunnel back to the same proxy
    socket.pipe(proxyConnection);
    proxyConnection.pipe(socket);
    socket.resume();
    if (head.length) socket.unshift(head);
  }

  private async addSecureContext(hostname: string) {
    const [key, cert] = await this.ca.getCertificateKeys(hostname);
    this.httpsServer.addContext(hostname, { key, cert });
  }

  public static async start(
    startingPort?: number,
    shouldFindAvailablePort = true,
  ): Promise<MitmProxy> {
    const port = Number(startingPort) || 20000;
    const proxy = new MitmProxy({ port, shouldFindAvailablePort });
    await proxy.listen();
    return proxy;
  }

  /*
   * Detect TLS from first bytes of data
   * Inspired from https://gist.github.com/tg-x/835636
   * used heuristic:
   * - an incoming connection using SSLv3/TLSv1 records should start with 0x16
   * - an incoming connection using SSLv2 records should start with the record size
   *   and as the first record should not be very big we can expect 0x80 or 0x00 (the MSB is a flag)
   * - everything else is considered to be unencrypted
   */
  private static isTlsByte(buffer: Buffer) {
    return buffer[0] === 0x16 || buffer[0] === 0x80 || buffer[0] === 0x00;
  }
}

async function startServer(
  server: http.Server,
  options: ListenOptions,
  shouldFindAvailablePort: boolean,
) {
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
  }).catch(error => {
    if (error.code === 'EADDRINUSE' && shouldFindAvailablePort) {
      if (process.env.NODE_ENV !== 'test') {
        log.warn('Mitm.startServer::PortUnavailable', { sessionId: null, port: options.port });
      }
      options.port = 0;
      return startServer(server, options, false);
    }
    throw error;
  });
}

async function closeServer(server: http.Server) {
  return new Promise(resolve => {
    server.close(() => {
      resolve();
    });
  });
}
