import Log from '@ulixee/commons/lib/Logger';
import * as http from 'http';
import * as http2 from 'http2';
import { ClientHttp2Stream } from 'http2';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import InterceptorHandler from './InterceptorHandler';
import HeadersHandler from './HeadersHandler';
import MitmRequestContext from '../lib/MitmRequestContext';
import HttpResponseCache from '../lib/HttpResponseCache';
import ResourceState from '../interfaces/ResourceState';

const { log } = Log(module);

export default abstract class BaseHttpHandler {
  public readonly context: IMitmRequestContext;

  protected abstract onError(kind: string, error: Error);

  protected constructor(
    request: Pick<
      IMitmRequestContext,
      'requestSession' | 'isSSL' | 'clientToProxyRequest' | 'proxyToClientResponse'
    >,
    isUpgrade: boolean,
    responseCache: HttpResponseCache,
  ) {
    this.context = MitmRequestContext.create({ ...request, isUpgrade }, responseCache);
  }

  protected async createProxyToServerRequest(): Promise<
    http.ClientRequest | http2.ClientHttp2Stream
  > {
    const context = this.context;
    const session = context.requestSession;

    try {
      // track request
      session.lookupSourceRedirect(this.context);
      session.emit('request', MitmRequestContext.toEmittedResource(this.context));

      if (session.isClosing) return context.setState(ResourceState.SessionClosed);

      // need to determine resource type before blocking
      await HeadersHandler.determineResourceType(context);

      if (await InterceptorHandler.shouldIntercept(context)) {
        context.setState(ResourceState.Intercepted);
        log.info(`Http.RequestBlocked`, {
          sessionId: session.sessionId,
          url: context.url.href,
        });
        await context.browserHasRequested;
        session.emit('response', MitmRequestContext.toEmittedResource(this.context));
        // already wrote reply
        return null;
      }

      // do one more check on the session before doing a connect
      if (session.isClosing) return context.setState(ResourceState.SessionClosed);

      const request = await session.requestAgent.request(context);
      this.context.proxyToServerRequest = request;
      this.context.events.on(
        request,
        'error',
        this.onError.bind(this, 'ProxyToServer.RequestError'),
      );

      if (this.context.isServerHttp2) {
        const h2Request = request as ClientHttp2Stream;
        this.bindHttp2ErrorListeners('ProxyToH2Server', h2Request, h2Request.session);
      }

      return this.context.proxyToServerRequest;
    } catch (err) {
      this.onError('ProxyToServer.RequestHandlerError', err);
    }
  }

  protected cleanup(): void {
    this.context.events.close('error');
    this.context.proxyToServerRequest = null;
    this.context.clientToProxyRequest = null;
    this.context.requestSession = null;
    this.context.proxyToClientResponse = null;
    this.context.proxyToServerMitmSocket = null;
    this.context.cacheHandler = null;
    this.context.browserHasRequested = null;
  }

  protected bindHttp2ErrorListeners(
    source: string,
    stream: http2.Http2Stream,
    session: http2.Http2Session,
  ): void {
    const events = this.context.events;
    if (!stream.listenerCount('error')) {
      events.on(stream, 'error', this.onError.bind(this, `${source}.Http2StreamError`));
    }

    events.on(stream, 'streamClosed', code => {
      if (!code) return;
      this.onError(`${source}.Http2StreamError`, new Error(`Stream Closed ${code}`));
    });

    if (session && !session.listenerCount('error')) {
      events.on(session, 'error', this.onError.bind(this, `${source}.Http2SessionError`));
    }
  }
}
