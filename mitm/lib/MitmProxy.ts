import net, { Socket } from 'net';
import http, { IncomingMessage } from 'http';
import http2 from 'http2';
import path from 'path';
import Log from '@secret-agent/commons/Logger';
import CertificateAuthority from './CertificateAuthority';
import IMitmProxyOptions from '../interfaces/IMitmProxyOptions';
import HttpRequestHandler from '../handlers/HttpRequestHandler';
import RequestSession from '../handlers/RequestSession';
import HttpUpgradeHandler from '../handlers/HttpUpgradeHandler';
import NetworkDb from './NetworkDb';

const { log } = Log(module);
const emptyResponse = `<html lang="en"><body>Empty</body></html>`;

/**
 * This module is heavily inspired by 'https://github.com/joeferner/node-http-mitm-proxy'
 */
export default class MitmProxy {
  public get port() {
    return this.httpPort;
  }

  public get httpPort() {
    return (this.httpServer.address() as net.AddressInfo)?.port;
  }

  public get http2Port() {
    return (this.http2Server.address() as net.AddressInfo)?.port;
  }

  private readonly options: IMitmProxyOptions;
  private readonly httpServer: http.Server;
  private readonly http2Server: http2.Http2SecureServer;
  private readonly serverConnects: net.Socket[] = [];

  private isClosing = false;

  private secureContexts: {
    [hostname: string]: Promise<void>;
  } = {};

  private ca: CertificateAuthority;
  private readonly db: NetworkDb;

  constructor(options: IMitmProxyOptions) {
    this.options = options || {};

    this.db = new NetworkDb(options.sslCaDir || process.cwd());
    this.ca = new CertificateAuthority(this.db);
    this.httpServer = http.createServer();
    this.httpServer.on('connect', this.onHttpConnect.bind(this));
    this.httpServer.on('clientError', this.onClientError.bind(this, false));
    this.httpServer.on('request', this.onHttpRequest.bind(this, false));
    this.httpServer.on('upgrade', this.onHttpUpgrade.bind(this, false));

    this.http2Server = http2.createSecureServer({ allowHTTP1: true });
    this.http2Server.on('sessionError', this.onClientError.bind(this, true));
    this.http2Server.on('request', this.onHttpRequest.bind(this, true));
    this.http2Server.on('upgrade', this.onHttpUpgrade.bind(this, true));
  }

  public async listen() {
    await startServer(this.httpServer, this.options.port ?? 0);

    await startServer(this.http2Server);

    // don't listen for errors until server already started
    this.httpServer.on('error', this.onGenericHttpError.bind(this, false));
    this.http2Server.on('error', this.onGenericHttpError.bind(this, true));
    return this;
  }

  public async close() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.db.close();
    while (this.serverConnects.length) {
      const connect = this.serverConnects.shift();
      connect.destroy();
    }
    delete this.secureContexts;

    await Promise.all([
      closeServer(this.httpServer),
      closeServer(this.http2Server),
      RequestSession.close(),
    ]);

    return this;
  }

  private async onHttpRequest(
    isSSL: boolean,
    clientToProxyRequest: http2.Http2ServerRequest,
    proxyToClientResponse: http2.Http2ServerResponse,
  ) {
    const sessionId = RequestSession.readSessionId(
      clientToProxyRequest.headers,
      clientToProxyRequest.socket.localPort,
    );
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(proxyToClientResponse.socket);
    }

    const requestSession = RequestSession.sessions[sessionId];
    if (requestSession?.isClosing) return;

    if (!requestSession) {
      log.warn('MitmProxy.RequestWithoutSessionId', {
        sessionId,
        isSSL,
        host: clientToProxyRequest.headers.host ?? clientToProxyRequest.headers[':authority'],
        url: clientToProxyRequest.url,
      });
      proxyToClientResponse.writeHead(504);
      return proxyToClientResponse.end();
    }

    if (requestSession.bypassAllWithEmptyResponse) {
      return proxyToClientResponse.end(emptyResponse);
    }

    await HttpRequestHandler.onRequest({
      isSSL,
      requestSession,
      clientToProxyRequest,
      proxyToClientResponse,
    });
  }

  private async onHttpUpgrade(
    isSSL: boolean,
    clientToProxyRequest: IncomingMessage,
    socket: Socket,
    head: Buffer,
  ) {
    // socket resumes in HttpUpgradeHandler.upgradeResponseHandler
    socket.pause();
    const sessionId = RequestSession.readSessionId(
      clientToProxyRequest.headers,
      clientToProxyRequest.socket.localPort,
    );
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(socket);
    }
    const requestSession = RequestSession.sessions[sessionId];
    if (requestSession?.isClosing) return;

    if (!requestSession) {
      log.warn('MitmProxy.UpgradeRequestWithoutSessionId', {
        sessionId,
        isSSL,
        host: clientToProxyRequest.headers.host,
        url: clientToProxyRequest.url,
      });
      return socket.end('HTTP/1.1 504 Proxy Error\r\n\r\n');
    }

    await HttpUpgradeHandler.onUpgrade({
      isSSL,
      socket,
      head,
      requestSession,
      clientToProxyRequest,
    });
  }

  private async onHttpConnect(request: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    const sessionId = RequestSession.readSessionId(request.headers, request.socket.localPort);
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(socket);
    }
    this.serverConnects.push(socket);
    socket.on('error', this.onConnectError.bind(this, request.url, 'ClientToProxy.ConnectError'));

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
      const hostname = request.url.split(':', 2)[0];

      if (!this.secureContexts[hostname]) {
        this.secureContexts[hostname] = this.addSecureContext(hostname);
      }
      await this.secureContexts[hostname];
      proxyToProxyPort = this.http2Port;
    }

    // for http, we are proxying to clear out the buffer (for websockets in particular)
    // NOTE: this probably can be optimized away for http

    const proxyConnection = net.connect({ port: proxyToProxyPort, allowHalfOpen: true });
    proxyConnection.on('error', error => {
      this.onConnectError(request.url, 'PROXY_TO_PROXY_CONNECT_ERROR', error);
      if (!socket.destroyed && socket.writable && socket.readable) {
        socket.destroy(error);
      }
    });

    proxyConnection.on('end', () => socket.destroy());
    proxyConnection.on('close', () => socket.destroy());
    socket.on('close', () => proxyConnection.destroy());
    socket.on('end', this.removeSocketConnect.bind(this, socket));

    await new Promise(resolve => proxyConnection.once('connect', resolve));
    RequestSession.registerProxySession(proxyConnection, sessionId);

    // create a tunnel back to the same proxy
    socket.pipe(proxyConnection).pipe(socket);
    if (head.length) socket.emit('data', head);
    socket.resume();
  }

  /////// ERROR HANDLING ///////////////////////////////////////////////////////

  private onGenericHttpError(isHttp2: boolean, error: Error) {
    const logLevel = this.isClosing ? 'stats' : 'error';
    log[logLevel](`Mitm.Http${isHttp2 ? '2' : ''}ServerError`, {
      sessionId: null,
      error,
    });
  }

  private onClientError(isHttp2: boolean, error: Error, socket: net.Socket) {
    if ((error as any).code === 'ECONNRESET' || !socket.writable) {
      return;
    }
    const kind = isHttp2 ? 'Http2.SessionError' : 'Http2.ClientError';
    log.error(`Mitm.${kind}`, {
      sessionId: null,
      error,
      socketAddress: socket.address(),
    });

    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }

  private onConnectError(hostname: string, errorKind: string, error: Error) {
    const errorCode = (error as any).errno ?? (error as any).code;
    if (errorCode === 'ECONNRESET') {
      log.info(`Got ECONNRESET on Proxy Connect, ignoring.`, {
        sessionId: null,
        hostname,
      });
    } else if (errorCode === 'ERR_STREAM_UNSHIFT_AFTER_END_EVENT') {
      log.info(`Got ERR_STREAM_UNSHIFT_AFTER_END_EVENT on Proxy Connect, ignoring.`, {
        sessionId: null,
        hostname,
        errorKind,
      });
    } else {
      const logLevel = this.isClosing ? 'stats' : 'error';
      log[logLevel]('MitmConnectError', {
        sessionId: null,
        errorKind,
        error,
        hostname,
      });
    }
  }

  private removeSocketConnect(socket: net.Socket) {
    const idx = this.serverConnects.indexOf(socket);
    if (idx < 0) return;
    this.serverConnects.splice(idx, 1);
  }

  private async addSecureContext(hostname: string) {
    const credentials = await this.ca.getCertificateKeys(hostname);
    this.http2Server.addContext(hostname, credentials);
  }

  public static async start(startingPort?: number): Promise<MitmProxy> {
    const proxy = new MitmProxy({ port: startingPort });
    await proxy.listen();
    return proxy;
  }

  private static isTlsByte(buffer: Buffer) {
    // check for clienthello byte
    return buffer[0] === 0x16;
  }
}

async function startServer(server: http.Server | http2.Http2SecureServer, listenPort?: number) {
  return new Promise<number>((resolve, reject) => {
    try {
      server.once('error', reject);
      server.listen(listenPort, () => {
        const port = (server.address() as net.AddressInfo).port;
        resolve(port);
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function closeServer(server: http.Server | http2.Http2SecureServer) {
  return new Promise(resolve => {
    server.close(() => resolve());
  });
}
