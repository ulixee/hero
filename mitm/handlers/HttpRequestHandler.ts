import * as http from 'http';
import Log from '@secret-agent/commons/Logger';
import * as http2 from 'http2';
import { ClientHttp2Stream, Http2ServerRequest, Http2ServerResponse } from 'http2';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import HeadersHandler from './HeadersHandler';
import CookieHandler from './CookieHandler';
import MitmRequestContext from '../lib/MitmRequestContext';
import { parseRawHeaders } from '../lib/Utils';
import BaseHttpHandler from './BaseHttpHandler';
import HttpResponseCache from '../lib/HttpResponseCache';

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
  }

  public async onRequest() {
    const { clientToProxyRequest, proxyToClientResponse } = this.context;

    try {
      clientToProxyRequest.pause();
      clientToProxyRequest.on('error', this.onError.bind(this, 'ClientToProxy.RequestError'));
      if (clientToProxyRequest instanceof Http2ServerRequest) {
        if (clientToProxyRequest.stream.session.listenerCount('error') === 0) {
          clientToProxyRequest.stream.session.on(
            'error',
            this.onError.bind(this, 'ClientToProxy.SessionError'),
          );
        }
      }
      proxyToClientResponse.on('error', this.onError.bind(this, 'ProxyToClient.ResponseError'));

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
  ) {
    const context = this.context;
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
        context.redirectedToUrl = redirectLocation as string;
        context.responseUrl = context.redirectedToUrl;
      }
    }
    await CookieHandler.readServerResponseCookies(context);

    await this.writeResponse();

    process.nextTick(agent => agent.freeSocket(context), context.requestSession.requestAgent);
  }

  protected onError(kind: string, error: Error) {
    const url = this.context.url.href;
    const { method, requestSession, proxyToClientResponse } = this.context;
    const sessionId = requestSession.sessionId;

    requestSession.emit('httpError', {
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

  private async writeRequest() {
    const { proxyToServerRequest, clientToProxyRequest } = this.context;

    const onWriteError = error => {
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

  private async writeResponse() {
    const context = this.context;
    if (!context.proxyToClientResponse) {
      log.warn('Error.NoProxyToClientResponse', {
        sessionId: context.requestSession.sessionId,
      });
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
  ) {
    const handler = new HttpRequestHandler(request);
    await handler.onRequest();
  }
}

export { redirectCodes };
