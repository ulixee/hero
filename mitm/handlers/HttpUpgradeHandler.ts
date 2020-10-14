import net from 'net';
import http from 'http';
import Log from '@secret-agent/commons/Logger';
import MitmRequestContext from '../lib/MitmRequestContext';
import CookieHandler from './CookieHandler';
import BaseHttpHandler from './BaseHttpHandler';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';

const { log } = Log(module);

export default class HttpUpgradeHandler extends BaseHttpHandler {
  constructor(
    request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest'>,
    readonly clientSocket: net.Socket,
    readonly clientHead: Buffer,
  ) {
    super(request, true, null);
  }

  public async onUpgrade() {
    try {
      this.clientSocket.on('error', this.onError.bind(this, 'ClientToProxy.UpgradeSocketError'));

      const proxyToServerRequest = await this.createProxyToServerRequest();
      if (!proxyToServerRequest) return;

      proxyToServerRequest.once('upgrade', this.onResponse.bind(this));
      proxyToServerRequest.end();
    } catch (err) {
      this.onError('ClientToProxy.UpgradeHandlerError', err);
    }
  }

  protected onError(errorType: string, error: Error) {
    const socket = this.clientSocket;
    const context = this.context;
    const url = context.url.href;
    const session = context.requestSession;
    const sessionId = session.sessionId;
    session.emit('httpError', { request: MitmRequestContext.toEmittedResource(context), error });

    if (!(error as any)?.isLogged) {
      log.error(`MitmWebSocket.${errorType}`, {
        sessionId,
        error,
        url,
      });
    }
    socket.destroy(error);
  }

  private async onResponse(
    serverResponse: http.IncomingMessage,
    serverSocket: net.Socket,
    serverHead: Buffer,
  ) {
    serverSocket.pause();
    MitmRequestContext.readHttp1Response(this.context, serverResponse);
    this.context.serverToProxyResponse = serverResponse;

    const clientSocket = this.clientSocket;

    const { proxyToServerMitmSocket } = this.context;

    clientSocket.on('end', () => proxyToServerMitmSocket.close());
    serverSocket.on('end', () => proxyToServerMitmSocket.close());
    proxyToServerMitmSocket.on('close', () => {
      // don't try to write again
      clientSocket.destroy();
      serverSocket.destroy();
    });

    // copy response message (have to write to raw socket)
    let responseMessage = `HTTP/${serverResponse.httpVersion} ${serverResponse.statusCode} ${serverResponse.statusMessage}\r\n`;
    for (let i = 0; i < serverResponse.rawHeaders.length; i += 2) {
      responseMessage += `${serverResponse.rawHeaders[i]}: ${serverResponse.rawHeaders[i + 1]}\r\n`;
    }
    await CookieHandler.readServerResponseCookies(this.context);

    clientSocket.write(`${responseMessage}\r\n`, error => {
      if (error) this.onError('ProxyToClient.UpgradeWriteError', error);
    });

    if (!serverSocket.readable || !serverSocket.writable) {
      return serverSocket.destroy();
    }
    serverSocket.on('error', this.onError.bind(this, 'ServerToProxy.UpgradeSocketError'));

    if (serverResponse.statusCode === 101) {
      clientSocket.setNoDelay(true);
      clientSocket.setTimeout(0);

      serverSocket.setNoDelay(true);
      serverSocket.setTimeout(0);
    }

    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);

    serverSocket.resume();
    clientSocket.resume();
    if (serverHead.length > 0) serverSocket.unshift(serverHead);
    if (this.clientHead.length > 0) clientSocket.unshift(this.clientHead);

    const formattedResponse = MitmRequestContext.toEmittedResource(this.context);
    this.context.requestSession.emit('response', formattedResponse);
  }

  public static async onUpgrade(
    request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest'> & {
      socket: net.Socket;
      head: Buffer;
    },
  ) {
    const handler = new HttpUpgradeHandler(request, request.socket, request.head);
    await handler.onUpgrade();
  }
}
