import * as net from 'net';
import * as http from 'http';
import Log, { hasBeenLoggedSymbol } from '@ulixee/commons/lib/Logger';
import MitmRequestContext from '../lib/MitmRequestContext';
import BaseHttpHandler from './BaseHttpHandler';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';

const { log } = Log(module);

export default class HttpUpgradeHandler extends BaseHttpHandler {
  constructor(
    request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest'>,
    readonly clientSocket: net.Socket,
    readonly clientHead: Buffer,
  ) {
    super(request, true, null);
    this.context.setState(ResourceState.ClientToProxyRequest);
    this.context.events.on(
      this.clientSocket,
      'error',
      this.onError.bind(this, 'ClientToProxy.UpgradeSocketError'),
    );
  }

  public async onUpgrade(): Promise<void> {
    try {
      const proxyToServerRequest = await this.createProxyToServerRequest();
      if (!proxyToServerRequest) {
        this.cleanup();
        return;
      }

      this.context.events.once(
        proxyToServerRequest,
        'upgrade',
        this.onResponse.bind(this),
      );
      proxyToServerRequest.end();
    } catch (err) {
      this.onError('ClientToProxy.UpgradeHandlerError', err);
    }
  }

  protected onError(errorType: string, error: Error): void {
    const socket = this.clientSocket;
    const context = this.context;
    const url = context.url.href;
    const session = context.requestSession;
    const sessionId = session.sessionId;
    context.setState(ResourceState.Error);

    session.emit('http-error', { request: MitmRequestContext.toEmittedResource(context), error });

    if (!error[hasBeenLoggedSymbol]) {
      log.info(`MitmWebSocketUpgrade.${errorType}`, {
        sessionId,
        error,
        url,
      });
    }
    socket.destroy(error);
    this.cleanup();
  }

  private async onResponse(
    serverResponse: http.IncomingMessage,
    serverSocket: net.Socket,
    serverHead: Buffer,
  ): Promise<void> {
    this.context.setState(ResourceState.ServerToProxyOnResponse);
    serverSocket.pause();
    MitmRequestContext.readHttp1Response(this.context, serverResponse);
    this.context.serverToProxyResponse = serverResponse;

    const clientSocket = this.clientSocket;

    const { proxyToServerMitmSocket, requestSession, events } = this.context;

    events.on(clientSocket, 'end', () => proxyToServerMitmSocket.close());
    events.on(serverSocket, 'end', () => proxyToServerMitmSocket.close());
    events.on(proxyToServerMitmSocket, 'close', () => {
      this.context.setState(ResourceState.End);
      // don't try to write again
      try {
        clientSocket.destroy();
        serverSocket.destroy();
        this.cleanup();
      } catch (err) {
        // no-operation
      }
    });

    // copy response message (have to write to raw socket)
    let responseMessage = `HTTP/${serverResponse.httpVersion} ${serverResponse.statusCode} ${serverResponse.statusMessage}\r\n`;
    for (let i = 0; i < serverResponse.rawHeaders.length; i += 2) {
      responseMessage += `${serverResponse.rawHeaders[i]}: ${serverResponse.rawHeaders[i + 1]}\r\n`;
    }
    await requestSession.willSendResponse(this.context);

    this.context.setState(ResourceState.WriteProxyToClientResponseBody);
    clientSocket.write(`${responseMessage}\r\n`, error => {
      if (error) this.onError('ProxyToClient.UpgradeWriteError', error);
    });

    if (!serverSocket.readable || !serverSocket.writable) {
      this.context.setState(ResourceState.PrematurelyClosed);
      try {
        return serverSocket.destroy();
      } catch (error) {
        // don't log if error
      }
    }
    events.on(
      serverSocket,
      'error',
      this.onError.bind(this, 'ServerToProxy.UpgradeSocketError'),
    );

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
    // don't log close since this stays open...
  }

  public static async onUpgrade(
    request: Pick<IMitmRequestContext, 'requestSession' | 'isSSL' | 'clientToProxyRequest'> & {
      socket: net.Socket;
      head: Buffer;
    },
  ): Promise<void> {
    const handler = new HttpUpgradeHandler(request, request.socket, request.head);
    await handler.onUpgrade();
  }
}
