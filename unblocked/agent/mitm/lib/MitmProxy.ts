import * as net from 'net';
import { Socket } from 'net';
import * as http from 'http';
import { IncomingMessage } from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import Log from '@ulixee/commons/lib/Logger';
import { createPromise } from '@ulixee/commons/lib/utils';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import CertificateGenerator, {
  ICertificateStore,
} from '@ulixee/unblocked-agent-mitm-socket/lib/CertificateGenerator';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import IMitmProxyOptions from '../interfaces/IMitmProxyOptions';
import HttpRequestHandler from '../handlers/HttpRequestHandler';
import RequestSession from '../handlers/RequestSession';
import HttpUpgradeHandler from '../handlers/HttpUpgradeHandler';
import env from '../env';
import ICertificateGenerator from '../interfaces/ICertificateGenerator';

const { log } = Log(module);
const emptyResponse = `<html lang="en"><body></body></html>`;

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

  public get httpsPort(): number | undefined {
    return (this.httpsServer.address() as net.AddressInfo)?.port;
  }

  private http2Sessions = new Set<http2.ServerHttp2Session>();
  // used if this is a one-off proxy
  private isolatedProxyForSessionId?: string;

  // shared session params
  private sessionById: { [sessionId: string]: RequestSession } = {};
  private sessionIdByPort: { [port: number]: string } = {};
  private portsBySessionId: { [sessionId: number]: Set<number> } = {};

  private readonly options: IMitmProxyOptions;
  private readonly httpServer: http.Server;
  private readonly httpsServer: https.Server;

  private readonly http2Server: http2.Http2SecureServer;
  private readonly serverConnects = new Set<net.Socket>();
  private readonly events = new EventSubscriber();

  private isClosing = false;

  private readonly certificateGenerator: ICertificateGenerator;
  private secureContexts: {
    [hostname: string]: Promise<void>;
  } = {};

  constructor(options: IMitmProxyOptions) {
    this.options = options;
    this.certificateGenerator = options.certificateGenerator;

    this.httpServer = http.createServer({ insecureHTTPParser: true });
    this.events.on(this.httpServer, 'connect', this.onHttpConnect.bind(this));
    this.events.on(this.httpServer, 'clientError', this.onClientError.bind(this, false));
    this.events.on(this.httpServer, 'request', this.onHttpRequest.bind(this, false));
    this.events.on(this.httpServer, 'upgrade', this.onHttpUpgrade.bind(this, false));

    this.httpsServer = https.createServer({ insecureHTTPParser: true });
    this.events.on(this.httpsServer, 'connect', this.onHttpConnect.bind(this));
    this.events.on(this.httpsServer, 'request', this.onHttpRequest.bind(this, true));
    this.events.on(this.httpsServer, 'upgrade', this.onHttpUpgrade.bind(this, true));

    this.http2Server = http2.createSecureServer({ allowHTTP1: true });
    this.events.on(this.http2Server, 'session', this.onHttp2Session.bind(this));
    this.events.on(this.http2Server, 'sessionError', this.onClientError.bind(this, true));
    this.events.on(this.http2Server, 'request', this.onHttpRequest.bind(this, true));
    this.events.on(this.http2Server, 'upgrade', this.onHttpUpgrade.bind(this, true));
  }

  public close(): void {
    if (this.isClosing) return;
    this.isClosing = true;

    const startLogId = log.info('MitmProxy.Closing', {
      sessionId: this.isolatedProxyForSessionId,
    });
    const errors: Error[] = [];

    for (const session of Object.values(this.sessionById)) {
      try {
        session.close();
      } catch (err) {
        errors.push(err);
      }
    }
    this.sessionById = {};

    for (const connect of this.serverConnects) {
      destroyConnection(connect);
    }
    this.secureContexts = {};
    try {
      this.httpServer.unref().close();
    } catch (err) {
      errors.push(err);
    }

    for (const session of this.http2Sessions) {
      try {
        session.socket?.unref()?.destroy();
        session.destroy();
      } catch (err) {
        errors.push(err);
      }
    }

    try {
      this.http2Sessions.clear();
      this.http2Server.unref().close();
    } catch (err) {
      errors.push(err);
    }
    try {
      this.httpsServer.unref().close();
    } catch (err) {
      errors.push(err);
    }
    this.events.close('error');

    log.stats('MitmProxy.Closed', {
      sessionId: this.isolatedProxyForSessionId,
      parentLogId: startLogId,
      closeErrors: errors,
    });
  }

  /////// RequestSessions //////////////////////////////////////////////////////////////////////////////////////////////

  public registerSession(session: RequestSession, isDefault: boolean): void {
    const { sessionId } = session;
    this.sessionById[sessionId] = session;
    if (isDefault) {
      this.isolatedProxyForSessionId = sessionId;

      this.events.once(session, 'close', () => this.close());
    } else {
      // if not default, need to clear out entries
      this.events.once(session, 'close', () =>
        setTimeout(() => this.removeSessionTracking(sessionId), 1e3).unref(),
      );
    }
  }

  public removeSessionTracking(sessionId: string): void {
    const ports = this.portsBySessionId[sessionId] || [];
    for (const port of ports) {
      delete this.sessionIdByPort[port];
    }
    delete this.portsBySessionId[sessionId];
    delete this.sessionById[sessionId];
  }

  protected async listen(): Promise<this> {
    await startServer(this.httpServer, this.options.port ?? 0);
    await startServer(this.httpsServer);
    await startServer(this.http2Server);

    // don't listen for errors until server already started
    this.events.on(this.httpServer, 'error', this.onGenericHttpError.bind(this, false));
    this.events.on(this.httpsServer, 'error', this.onGenericHttpError.bind(this, false));
    this.events.on(this.http2Server, 'error', this.onGenericHttpError.bind(this, true));

    return this;
  }

  private async onHttpRequest(
    isSSL: boolean,
    clientToProxyRequest: http.IncomingMessage | http2.Http2ServerRequest,
    proxyToClientResponse: http.ServerResponse | http2.Http2ServerResponse,
  ): Promise<void> {
    const sessionId = this.readSessionId(
      clientToProxyRequest.headers,
      clientToProxyRequest.socket.remotePort,
    );
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(proxyToClientResponse.socket);
    }

    const requestSession = this.sessionById[sessionId];
    if (requestSession?.isClosing) return;

    if (!requestSession) {
      log.warn('MitmProxy.RequestWithoutSession', {
        sessionId,
        isSSL,
        host: clientToProxyRequest.headers.host ?? clientToProxyRequest.headers[':authority'],
        url: clientToProxyRequest.url,
      });
      proxyToClientResponse.writeHead(504);
      proxyToClientResponse.end();
      return;
    }

    if (requestSession.bypassAllWithEmptyResponse) {
      proxyToClientResponse.end(emptyResponse);
      return;
    }

    try {
      await HttpRequestHandler.onRequest({
        isSSL,
        requestSession,
        clientToProxyRequest,
        proxyToClientResponse,
      });
    } catch (error) {
      // this can only happen during processing of request
      log.warn('MitmProxy.ErrorProcessingRequest', {
        sessionId,
        isSSL,
        error,
        host: clientToProxyRequest.headers.host ?? clientToProxyRequest.headers[':authority'],
        url: clientToProxyRequest.url,
      });
      try {
        proxyToClientResponse.writeHead(400);
        proxyToClientResponse.end('Bad request');
      } catch (e) {
        // don't double throw or log
      }
    }
  }

  private async onHttpUpgrade(
    isSSL: boolean,
    clientToProxyRequest: IncomingMessage,
    socket: Socket,
    head: Buffer,
  ): Promise<void> {
    // socket resumes in HttpUpgradeHandler.upgradeResponseHandler
    socket.pause();
    const sessionId = this.readSessionId(
      clientToProxyRequest.headers,
      clientToProxyRequest.socket.remotePort,
    );
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(socket);
    }
    const requestSession = this.sessionById[sessionId];
    if (requestSession?.isClosing) return;

    if (!requestSession) {
      log.warn('MitmProxy.UpgradeRequestWithoutSession', {
        sessionId,
        isSSL,
        host: clientToProxyRequest.headers.host,
        url: clientToProxyRequest.url,
      });
      socket.end('HTTP/1.1 504 Proxy Error\r\n\r\n');
      return;
    }

    try {
      await HttpUpgradeHandler.onUpgrade({
        isSSL,
        socket,
        head,
        requestSession,
        clientToProxyRequest,
      });
    } catch (error) {
      this.onClientError(false, error, socket);
    }
  }

  private async onHttpConnect(
    request: http.IncomingMessage,
    socket: net.Socket,
    head: Buffer,
  ): Promise<void> {
    if (this.isClosing) return this.tryCloseConnectSocket(socket);

    const sessionId = this.readSessionId(request.headers, request.socket.remotePort);
    if (!sessionId) {
      return RequestSession.sendNeedsAuth(socket);
    }
    this.serverConnects.add(socket);
    socket.on('error', error => {
      this.onConnectError(request.url, 'ClientToProxy.ConnectError', error);
      this.serverConnects.delete(socket);
    });

    socket.write('HTTP/1.1 200 Connection established\r\n\r\n');
    // we need first byte of data to detect if request is SSL encrypted
    if (!head || head.length === 0) {
      head = await new Promise<Buffer>(resolve => socket.once('data', resolve));
    }

    socket.pause();

    let proxyToProxyPort = this.httpPort;

    // for https we create a new connect back to the https server so we can have the proper cert and see the traffic
    if (MitmProxy.isTlsByte(head)) {
      proxyToProxyPort = this.httpsPort;
      // URL is in the form 'hostname:port'
      const [hostname, port] = request.url.split(':', 2);

      try {
        const [isHttp2] = await Promise.all([
          this.isHttp2(sessionId, hostname, port),
          this.addSecureContext(hostname),
        ]);
        if (isHttp2) {
          proxyToProxyPort = this.http2Port;
        }
      } catch (error) {
        if (!(error instanceof CanceledPromiseError)) {
          this.onConnectError(request.url, 'ClientToProxy.GenerateCertError', error);
        }
        return this.tryCloseConnectSocket(socket);
      }
    }

    const connectedPromise = createPromise();
    const proxyConnection = net.connect(
      { port: proxyToProxyPort, allowHalfOpen: false },
      connectedPromise.resolve,
    );
    this.serverConnects.add(proxyConnection);
    proxyConnection.on('error', error => {
      this.onConnectError(request.url, 'ProxyToProxy.ConnectError', error);
      if (!socket.destroyed && socket.writable && socket.readable) {
        socket.destroy(error);
      }
    });

    proxyConnection.once('end', () => this.serverConnects.delete(proxyConnection));
    socket.once('end', () => this.serverConnects.delete(socket));

    proxyConnection.once('close', () => destroyConnection(socket));
    socket.once('close', () => destroyConnection(proxyConnection));

    await connectedPromise;
    this.registerProxySession(proxyConnection, sessionId);

    socket.setNoDelay(true);
    proxyConnection.setNoDelay(true);
    // create a tunnel back to the same proxy
    socket.pipe(proxyConnection).pipe(socket);
    if (head.length) socket.emit('data', head);
    socket.resume();
  }

  private onHttp2Session(session: http2.ServerHttp2Session): void {
    this.http2Sessions.add(session);
    this.events.once(session, 'close', () => this.http2Sessions.delete(session));
  }

  private async isHttp2(sessionId: string, hostname: string, port: string): Promise<boolean> {
    try {
      const requestSession = this.sessionById[sessionId];
      if (
        requestSession.bypassAllWithEmptyResponse ||
        requestSession.shouldInterceptRequest(`https://${hostname}:${port}`) ||
        requestSession.shouldInterceptRequest(`https://${hostname}`)
      ) {
        return false;
      }

      return await requestSession.requestAgent.isHostAlpnH2(hostname, port);
    } catch (error) {
      if (error instanceof CanceledPromiseError) {
        return false;
      }
      log.warn('Connect.AlpnLookupError', {
        hostname,
        error,
        sessionId,
      });
    }
    return false;
  }

  /////// ERROR HANDLING ///////////////////////////////////////////////////////

  private onGenericHttpError(isHttp2: boolean, error: Error): void {
    const logLevel = this.isClosing ? 'stats' : 'error';
    log[logLevel](`Mitm.Http${isHttp2 ? '2' : ''}ServerError`, {
      sessionId: this.isolatedProxyForSessionId,
      error,
    });
  }

  private tryCloseConnectSocket(socket: net.Socket): void {
    try {
      // socket.end();
      this.serverConnects.delete(socket);
    } catch (err) {}
  }

  private onClientError(isHttp2: boolean, error: Error, socket: net.Socket): void {
    if ((error as any).code === 'ECONNRESET' || !socket.writable) {
      return;
    }
    const kind = isHttp2 ? 'Http2.SessionError' : 'Http2.ClientError';
    log.error(`Mitm.${kind}`, {
      sessionId: this.isolatedProxyForSessionId,
      error,
      socketAddress: socket.address(),
    });

    try {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    } catch (e) {
      // just drown these
    }
  }

  private onConnectError(hostname: string, errorKind: string, error: Error): void {
    const errorCodes = [(error as any).errno, (error as any).code];
    if (errorCodes.includes('ECONNRESET')) {
      log.info(`Got ECONNRESET on Proxy Connect, ignoring.`, {
        sessionId: this.isolatedProxyForSessionId,
        hostname,
      });
    } else if (errorCodes.includes('ECONNABORTED')) {
      log.info(`Got ECONNABORTED on Proxy Connect, ignoring.`, {
        sessionId: this.isolatedProxyForSessionId,
        hostname,
      });
    } else if (errorCodes.includes('ERR_STREAM_UNSHIFT_AFTER_END_EVENT')) {
      log.info(`Got ERR_STREAM_UNSHIFT_AFTER_END_EVENT on Proxy Connect, ignoring.`, {
        sessionId: this.isolatedProxyForSessionId,
        hostname,
        errorKind,
      });
    } else if (errorCodes.includes('EPIPE')) {
      log.info(`Got EPIPE on Proxy Connect, ignoring.`, {
        sessionId: this.isolatedProxyForSessionId,
        hostname,
        errorKind,
      });
    } else {
      const logLevel = this.isClosing ? 'stats' : 'error';
      log[logLevel]('MitmConnectError', {
        sessionId: this.isolatedProxyForSessionId,
        errorKind,
        error,
        errorCodes,
        hostname,
      });
    }
  }

  private async addSecureContext(hostname: string): Promise<void> {
    if (this.isClosing) return;
    if (hostname.includes(':')) hostname = hostname.split(':').shift();

    this.secureContexts[hostname] ??= this.certificateGenerator
      .getCertificate(hostname)
      .then(cert => {
        // eslint-disable-next-line promise/always-return
        if (!cert.cert) return null;
        this.http2Server.addContext(hostname, cert);
        this.httpsServer.addContext(hostname, cert);
      });

    try {
      await this.secureContexts[hostname];
    } catch (error) {
      if (error instanceof CanceledPromiseError || this.isClosing) return;
      throw error;
    }
  }

  /////// SESSION ID MGMT //////////////////////////////////////////////////////////////////////////////////////////////

  private readSessionId(
    requestHeaders: { [key: string]: string | string[] | undefined },
    remotePort: number,
  ): string {
    if (this.isolatedProxyForSessionId) return this.isolatedProxyForSessionId;

    const authHeader = requestHeaders['proxy-authorization'] as string;
    if (!authHeader) {
      return this.sessionIdByPort[remotePort];
    }

    const [, sessionId] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    return sessionId;
  }

  private registerProxySession(loopbackProxySocket: net.Socket, sessionId: string): void {
    // local port is the side that originates from our http server
    this.portsBySessionId[sessionId] ??= new Set();
    this.portsBySessionId[sessionId].add(loopbackProxySocket.localPort);
    this.sessionIdByPort[loopbackProxySocket.localPort] = sessionId;
  }

  public static createCertificateGenerator(
    store?: ICertificateStore,
    sslCaDir?: string,
  ): CertificateGenerator {
    sslCaDir ??= env.defaultStorageDirectory;

    return new CertificateGenerator({ storageDir: sslCaDir });
  }

  public static async start(certificateGenerator: ICertificateGenerator): Promise<MitmProxy> {
    const proxy = new MitmProxy({ certificateGenerator });

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
    socket.unref().destroy();
  } catch (e) {
    // nothing to do
  }
}

function startServer(
  server: http.Server | http2.Http2SecureServer,
  listenPort?: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      server.once('error', reject);
      server.listen(listenPort, resolve);
    } catch (err) {
      reject(err);
    }
  });
}
