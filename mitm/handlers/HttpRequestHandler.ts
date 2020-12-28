import * as http from 'http';
import Log from '@secret-agent/commons/Logger';
import * as http2 from 'http2';
import { ClientHttp2Stream, Http2ServerRequest, Http2ServerResponse } from 'http2';
import { URL } from 'url';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import HeadersHandler from './HeadersHandler';
import CookieHandler from './CookieHandler';
import MitmRequestContext from '../lib/MitmRequestContext';
import { parseRawHeaders } from '../lib/Utils';
import BaseHttpHandler from './BaseHttpHandler';
import HttpResponseCache from '../lib/HttpResponseCache';
import ResourceState from '../interfaces/ResourceState';

const { log } = Log(module);
const redirectCodes = new Set([300, 301, 302, 303, 305, 307, 308]);

export default class HttpRequestHandler extends BaseHttpHandler {
  protected static responseCache = new HttpResponseCache();

  constructor(
    request: Pick<
      IMitmRequestContext,
      'requestSession' | 'isSSL' | 'clientToProxyRequest' | 'proxyToClientResponse'
    >,
  ) {
    super(request, false, HttpRequestHandler.responseCache);
    this.context.setState(ResourceState.ClientToProxyRequest);

    // register error listeners first
    const { clientToProxyRequest, proxyToClientResponse } = request;
    clientToProxyRequest.on('error', this.onError.bind(this, 'ClientToProxy.RequestError'));
    if (clientToProxyRequest instanceof Http2ServerRequest) {
      clientToProxyRequest.stream.on(
        'error',
        this.onError.bind(this, 'ClientToProxy.Http2StreamError'),
      );
      const http2Session = clientToProxyRequest.stream.session;
      if (!http2Session.listenerCount('error')) {
        http2Session.on('error', this.onError.bind(this, 'ClientToProxy.Http2SessionError'));
      }
    }
    if (proxyToClientResponse instanceof Http2ServerResponse) {
      proxyToClientResponse.stream.on(
        'error',
        this.onError.bind(this, 'ProxyToClient.Http2StreamError'),
      );
      const http2Session = proxyToClientResponse.stream.session;
      if (!http2Session.listenerCount('error')) {
        http2Session.on('error', this.onError.bind(this, 'ProxyToClient.Http2SessionError'));
      }
    }
    proxyToClientResponse.on('error', this.onError.bind(this, 'ProxyToClient.ResponseError'));
  }

  public async onRequest(): Promise<void> {
    const { clientToProxyRequest } = this.context;

    try {
      clientToProxyRequest.pause();

      const proxyToServerRequest = await this.createProxyToServerRequest();
      if (!proxyToServerRequest) return;

      proxyToServerRequest.on('response', this.onResponse.bind(this));

      clientToProxyRequest.resume();

      // now write request
      await this.writeRequest();
    } catch (err) {
      this.onError('ClientToProxy.HandlerError', err);
    }
  }

  protected async onResponse(
    response: http.IncomingMessage | (http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader),
    flags?: number,
    rawHeaders?: string[],
  ): Promise<void> {
    const context = this.context;
    context.setState(ResourceState.ServerToProxyOnResponse);

    if (response instanceof http.IncomingMessage) {
      MitmRequestContext.readHttp1Response(context, response);
    } else {
      MitmRequestContext.readHttp2Response(
        context,
        context.proxyToServerRequest as ClientHttp2Stream,
        response[':status'],
        rawHeaders,
      );
    }
    const { serverToProxyResponse } = context;
    serverToProxyResponse.on('error', this.onError.bind(this, 'ServerToProxy.ResponseError'));

    try {
      context.cacheHandler.onResponseHeaders();
    } catch (err) {
      return this.onError('ServerToProxy.ResponseHeadersHandlerError', err);
    }

    if (redirectCodes.has(context.status)) {
      const redirectLocation = context.responseHeaders.location || context.responseHeaders.Location;
      if (redirectLocation) {
        const redirectUrl = new URL(redirectLocation as string, context.url);
        context.redirectedToUrl = redirectUrl.href;
        context.responseUrl = context.redirectedToUrl;
      }
    }
    await CookieHandler.readServerResponseCookies(context);

    await this.writeResponse();

    context.setState(ResourceState.End);

    process.nextTick(agent => agent.freeSocket(context), context.requestSession.requestAgent);
  }

  protected onError(kind: string, error: Error): void {
    const url = this.context.url.href;
    const { method, requestSession, proxyToClientResponse } = this.context;
    const sessionId = requestSession.sessionId;

    this.context.setState(ResourceState.Error);
    requestSession.emit('http-error', {
      request: MitmRequestContext.toEmittedResource(this.context),
      error,
    });

    const logLevel = requestSession.isClosing ? 'stats' : 'error';

    log[logLevel](`MitmHttpRequest.${kind}`, {
      sessionId,
      request: `${method}: ${url}`,
      error,
    });
    try {
      if (!proxyToClientResponse.headersSent) proxyToClientResponse.writeHead(504);
      if (!proxyToClientResponse.finished) proxyToClientResponse.end(`${error}`);
    } catch (e) {
      // drown errors
    }
  }

  private async writeRequest(): Promise<void> {
    this.context.setState(ResourceState.WriteProxyToServerRequestBody);
    const { proxyToServerRequest, clientToProxyRequest } = this.context;

    const onWriteError = (error): void => {
      if (error) this.onError('ProxyToServer.WriteError', error);
    };

    const data: Buffer[] = [];
    for await (const chunk of clientToProxyRequest) {
      data.push(chunk);
      proxyToServerRequest.write(chunk, onWriteError);
    }
    HeadersHandler.sendRequestTrailers(this.context);
    proxyToServerRequest.end();
    this.context.requestPostData = Buffer.concat(data);
  }

  private async writeResponse(): Promise<void> {
    const context = this.context;
    if (!context.proxyToClientResponse) {
      log.warn('Error.NoProxyToClientResponse', {
        sessionId: context.requestSession.sessionId,
      });
      context.setState(ResourceState.PrematurelyClosed);
      return;
    }

    const { serverToProxyResponse, proxyToClientResponse } = this.context;

    proxyToClientResponse.statusCode = context.status;
    // write individually so we properly write header-lists
    for (const [key, value] of Object.entries(context.responseHeaders)) {
      proxyToClientResponse.setHeader(key, value);
    }

    serverToProxyResponse.once('trailers', headers => {
      context.responseTrailers = headers;
    });

    try {
      proxyToClientResponse.writeHead(proxyToClientResponse.statusCode);
    } catch (err) {
      return this.onError('ServerToProxy.WriteResponseHeadError', err);
    }

    context.setState(ResourceState.WriteProxyToClientResponseBody);

    for await (const chunk of serverToProxyResponse) {
      const data = context.cacheHandler.onResponseData(chunk as Buffer);
      if (data && !(proxyToClientResponse as Http2ServerResponse).stream?.destroyed) {
        proxyToClientResponse.write(data, error => {
          if (error) this.onError('ServerToProxy.WriteResponseError', error);
        });
      }
    }

    if (context.cacheHandler.shouldServeCachedData) {
      proxyToClientResponse.write(context.cacheHandler.cacheData, error => {
        if (error) this.onError('ServerToProxy.WriteCachedResponseError', error);
      });
    }

    if (serverToProxyResponse instanceof http.IncomingMessage) {
      context.responseTrailers = parseRawHeaders(serverToProxyResponse.rawTrailers);
    }
    if (context.responseTrailers) {
      proxyToClientResponse.addTrailers(context.responseTrailers);
    }
    proxyToClientResponse.end();

    context.cacheHandler.onResponseEnd();
    context.requestSession.emit('response', MitmRequestContext.toEmittedResource(context));
  }

  public static async onRequest(
    request: Pick<
      IMitmRequestContext,
      'requestSession' | 'isSSL' | 'clientToProxyRequest' | 'proxyToClientResponse'
    >,
  ): Promise<void> {
    const handler = new HttpRequestHandler(request);
    await handler.onRequest();
  }
}

export { redirectCodes };
