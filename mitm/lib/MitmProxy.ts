import * as net from 'net';
import { Socket } from 'net';
import * as http from 'http';
import { IncomingMessage } from 'http';
import * as http2 from 'http2';
import Log from '@secret-agent/commons/Logger';
import * as Os from 'os';
import * as Path from 'path';
import { createPromise } from '@secret-agent/commons/utils';
import CertificateAuthority from './CertificateAuthority';
import IMitmProxyOptions from '../interfaces/IMitmProxyOptions';
import HttpRequestHandler from '../handlers/HttpRequestHandler';
import RequestSession from '../handlers/RequestSession';
import HttpUpgradeHandler from '../handlers/HttpUpgradeHandler';
import NetworkDb from './NetworkDb';

const { log } = Log(module);
const emptyResponse = `<html lang="en"><body>Empty</body></html>`;

const defaultStorageDirectory =
  process.env.SA_NETWORK_DIR ??
  process.env.SA_SESSIONS_DIR ??
  Path.join(Os.tmpdir(), '.secret-agent');

/**
 * This module is heavily inspired by 'https://github.com/joeferner/node-http-mitm-proxy'
 */
export default class MitmProxy {
  public get port(): number {
    return this.httpPort;
  }

  public get httpPort(): number | undefined {
    return (this.httpServer.address() as net.AddressInfo)?.port;
  }

  public get http2Port(): number | undefined {
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
    this.options = options;

    this.db = new NetworkDb(options.sslCaDir);
    this.ca = new CertificateAuthority(this.db);
    this.httpServer = http.createServer({ insecureHTTPParser: true });
    this.httpServer.on('connect', this.onHttpConnect.bind(this));
    this.httpServer.on('clientError', this.onClientError.bind(this, false));
    this.httpServer.on('request', this.onHttpRequest.bind(this, false));
    this.httpServer.on('upgrade', this.onHttpUpgrade.bind(this, false));

    this.http2Server = http2.createSecureServer({ allowHTTP1: true });
    this.http2Server.on('sessionError', this.onClientError.bind(this, true));
    this.http2Server.on('request', this.onHttpRequest.bind(this, true));
    this.http2Server.on('upgrade', this.onHttpUpgrade.bind(this, true));
  }

  public async listen(): Promise<this> {
    await startServer(this.httpServer, this.options.port ?? 0);

    await startServer(this.http2Server);

    // don't listen for errors until server already started
    this.httpServer.on('error', this.onGenericHttpError.bind(this, false));
    this.http2Server.on('error', this.onGenericHttpError.bind(this, true));
    return this;
  }

  public async close(): Promise<this> {
    if (this.isClosing) return;
    this.isClosing = true;
    this.db.close();
    while (this.serverConnects.length) {
      const connect = this.serverConnects.shift();
      destroyConnection(connect);
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
  ): Promise<void> {
    const sessionId = RequestSession.readSessionId(
      clientToProxyRequest.headers,
      clientToProxyRequest.socket.remotePort,
    );
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(proxyToClientResponse.socket);
    }

    const requestSession = RequestSession.sessionById[sessionId];
    if (requestSession?.isClosing) return;

    if (!requestSession) {
      log.warn('MitmProxy.RequestWithoutSession', {
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
  ): Promise<void> {
    // socket resumes in HttpUpgradeHandler.upgradeResponseHandler
    socket.pause();
    const sessionId = RequestSession.readSessionId(
      clientToProxyRequest.headers,
      clientToProxyRequest.socket.remotePort,
    );
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(socket);
    }
    const requestSession = RequestSession.sessionById[sessionId];
    if (requestSession?.isClosing) return;

    if (!requestSession) {
      log.warn('MitmProxy.UpgradeRequestWithoutSession', {
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

  private async onHttpConnect(
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<void> {
    const sessionId = RequestSession.readSessionId(request.headers, request.socket.remotePort);
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

    const connectedPromise = createPromise();
    const proxyConnection = net.connect(
      { port: proxyToProxyPort, allowHalfOpen: false },
      connectedPromise.resolve,
    );
    proxyConnection.on('error', error => {
      this.onConnectError(request.url, 'ProxyToProxy.ConnectError', error);
      if (!socket.destroyed && socket.writable && socket.readable) {
        socket.destroy(error);
      }
    });

    proxyConnection.on('end', () => destroyConnection(socket));
    proxyConnection.on('close', () => destroyConnection(socket));
    socket.on('close', () => destroyConnection(proxyConnection));
    socket.on('end', this.removeSocketConnect.bind(this, socket));

    await connectedPromise;
    RequestSession.registerProxySession(proxyConnection, sessionId);

    // create a tunnel back to the same proxy
    socket.pipe(proxyConnection).pipe(socket);
    if (head.length) socket.emit('data', head);
    socket.resume();
  }

  /////// ERROR HANDLING ///////////////////////////////////////////////////////

  private onGenericHttpError(isHttp2: boolean, error: Error): void {
    const logLevel = this.isClosing ? 'stats' : 'error';
    log[logLevel](`Mitm.Http${isHttp2 ? '2' : ''}ServerError`, {
      sessionId: null,
      error,
    });
  }

  private onClientError(isHttp2: boolean, error: Error, socket: net.Socket): void {
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

  private onConnectError(hostname: string, errorKind: string, error: Error): void {
    const errorCodes = [(error as any).errno, (error as any).code];
    if (errorCodes.includes('ECONNRESET')) {
      log.info(`Got ECONNRESET on Proxy Connect, ignoring.`, {
        sessionId: null,
        hostname,
      });
    } else if (errorCodes.includes('ECONNABORTED')) {
      log.info(`Got ECONNABORTED on Proxy Connect, ignoring.`, {
        sessionId: null,
        hostname,
      });
    } else if (errorCodes.includes('ERR_STREAM_UNSHIFT_AFTER_END_EVENT')) {
      log.info(`Got ERR_STREAM_UNSHIFT_AFTER_END_EVENT on Proxy Connect, ignoring.`, {
        sessionId: null,
        hostname,
        errorKind,
      });
    } else if (errorCodes.includes('EPIPE')) {
      log.info(`Got EPIPE on Proxy Connect, ignoring.`, {
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
        errorCodes,
        hostname,
      });
    }
  }

  private removeSocketConnect(socket: net.Socket): void {
    const idx = this.serverConnects.indexOf(socket);
    if (idx < 0) return;
    this.serverConnects.splice(idx, 1);
  }

  private async addSecureContext(hostname: string): Promise<void> {
    const credentials = await this.ca.getCertificateKeys(hostname);
    this.http2Server.addContext(hostname, credentials);
  }

  public static async start(startingPort?: number, sslCaDir?: string): Promise<MitmProxy> {
    const proxy = new MitmProxy({
      port: startingPort,
      sslCaDir: sslCaDir || defaultStorageDirectory,
    });
    await proxy.listen();
    return proxy;
  }

  private static isTlsByte(buffer: Buffer): boolean {
    // check for clienthello byte
    return buffer[0] === 0x16;
  }
}

function destroyConnection(socket: net.Socket): void {
  try {
    socket.destroy();
  } catch (e) {
    // nothing to do
  }
}

function startServer(
  server: http.Server | http2.Http2SecureServer,
  listenPort?: number,
): Promise<number> {
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

function closeServer(server: http.Server | http2.Http2SecureServer): Promise<void> {
  return new Promise<void>(resolve => {
    server.close(() => resolve());
  });
}
