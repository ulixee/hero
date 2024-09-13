import * as http2 from 'http2';
import { ClientHttp2Stream, ServerHttp2Stream } from 'http2';
import Log, { hasBeenLoggedSymbol } from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from '../lib/MitmRequestContext';
import InterceptorHandler from './InterceptorHandler';
import HeadersHandler from './HeadersHandler';
import ResourceState from '../interfaces/ResourceState';
import RequestSession from './RequestSession';

const { log } = Log(module);

export default class Http2PushPromiseHandler {
  private readonly context: IMitmRequestContext;
  private onResponseHeadersPromise: Promise<void>;
  private logger: IBoundLog;
  private get session(): RequestSession {
    return this.context.requestSession;
  }

  constructor(
    readonly parentContext: IMitmRequestContext,
    serverPushStream: http2.ClientHttp2Stream,
    readonly requestHeaders: http2.IncomingHttpHeaders & http2.IncomingHttpStatusHeader,
    flags: number,
    rawHeaders: string[],
  ) {
    const session = parentContext.requestSession;
    const sessionId = session.sessionId;
    this.logger = session.logger.createChild(module);
    log.info('Http2Client.pushReceived', { sessionId, requestHeaders, flags });
    this.logger.info('Http2Client.pushReceived', { requestHeaders, flags });
    this.context = MitmRequestContext.createFromHttp2Push(parentContext, rawHeaders);
    this.context.events.on(serverPushStream, 'error', error => {
      this.logger.warn('Http2.ProxyToServer.PushStreamError', {
        error,
      });
    });

    this.context.serverToProxyResponse = serverPushStream;
    this.session.lookupSourceRedirect(this.context);
    this.context.setState(ResourceState.ServerToProxyPush);
    this.session.emit('request', MitmRequestContext.toEmittedResource(this.context));
  }

  public async onRequest(): Promise<void> {
    const pushContext = this.context;
    const parentContext = this.parentContext;
    const session = this.session;
    const serverPushStream = this.context.serverToProxyResponse as http2.ClientHttp2Stream;

    if (await InterceptorHandler.shouldIntercept(pushContext)) {
      await pushContext.browserHasRequested;
      session.emit('response', MitmRequestContext.toEmittedResource(pushContext));
      pushContext.setState(ResourceState.Intercepted);
      return serverPushStream.close(http2.constants.NGHTTP2_CANCEL);
    }

    HeadersHandler.cleanPushHeaders(pushContext);

    this.onResponseHeadersPromise = new Promise<void>(resolve => {
      const events = this.context.events;
      events.once(serverPushStream, 'push', (responseHeaders, responseFlags, rawHeaders) => {
        MitmRequestContext.readHttp2Response(
          pushContext,
          serverPushStream,
          responseHeaders[':status'],
          rawHeaders,
        );
        resolve();
      });
    });

    if (serverPushStream.destroyed) {
      pushContext.setState(ResourceState.PrematurelyClosed);
      return;
    }

    const clientToProxyRequest = parentContext.clientToProxyRequest as http2.Http2ServerRequest;
    pushContext.setState(ResourceState.ProxyToClientPush);
    try {
      clientToProxyRequest.stream.pushStream(
        pushContext.requestHeaders,
        this.onClientPushPromiseCreated.bind(this),
      );
    } catch (error) {
      this.logger.warn('Http2.ClientToProxy.CreatePushStreamError', {
        error,
      });
    }
  }

  private async onClientPushPromiseCreated(
    createPushStreamError: Error,
    proxyToClientPushStream: ServerHttp2Stream,
  ): Promise<void> {
    this.context.setState(ResourceState.ProxyToClientPushResponse);
    const serverToProxyPushStream = this.context.serverToProxyResponse as ClientHttp2Stream;
    const cache = this.context.cacheHandler;
    const session = this.context.requestSession;
    const events = this.context.events;

    if (createPushStreamError) {
      this.logger.warn('Http2.ClientToProxy.PushStreamError', {
        error: createPushStreamError,
      });
      return;
    }

    events.on(proxyToClientPushStream, 'error', pushError => {
      this.logger.warn('Http2.ClientToProxy.PushStreamError', {
        error: pushError,
      });
    });

    events.on(serverToProxyPushStream, 'headers', additional => {
      if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.additionalHeaders(additional);
    });

    let trailers: http2.IncomingHttpHeaders;
    events.once(serverToProxyPushStream, 'trailers', trailerHeaders => {
      trailers = trailerHeaders;
    });

    await this.onResponseHeadersPromise;
    if (proxyToClientPushStream.destroyed || serverToProxyPushStream.destroyed) {
      return;
    }
    cache.onHttp2PushStream();

    try {
      if (cache.shouldServeCachedData) {
        if (!proxyToClientPushStream.destroyed) {
          proxyToClientPushStream.write(cache.cacheData, err => {
            if (err) this.onHttp2PushError('Http2PushProxyToClient.CacheWriteError', err);
          });
        }
        if (!serverToProxyPushStream.destroyed) {
          serverToProxyPushStream.close(http2.constants.NGHTTP2_REFUSED_STREAM);
        }
      } else {
        proxyToClientPushStream.respond(this.context.responseHeaders, { waitForTrailers: true });
        events.on(proxyToClientPushStream, 'wantTrailers', (): void => {
          this.context.responseTrailers = trailers;
          if (trailers) proxyToClientPushStream.sendTrailers(this.context.responseTrailers ?? {});
          else proxyToClientPushStream.close();
        });

        this.context.setState(ResourceState.ServerToProxyPushResponse);
        for await (const chunk of serverToProxyPushStream) {
          if (proxyToClientPushStream.destroyed || serverToProxyPushStream.destroyed) return;
          cache.onResponseData(chunk);
          proxyToClientPushStream.write(chunk, err => {
            if (err) this.onHttp2PushError('Http2PushProxyToClient.WriteError', err);
          });
        }
        if (!serverToProxyPushStream.destroyed) serverToProxyPushStream.end();
      }

      if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.end();
      cache.onResponseEnd();

      await HeadersHandler.determineResourceType(this.context);
      await this.context.browserHasRequested;
      session.emit('response', MitmRequestContext.toEmittedResource(this.context));
    } catch (writeError) {
      this.onHttp2PushError('Http2PushProxyToClient.UnhandledError', writeError);
      if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.destroy();
    } finally {
      this.cleanupEventListeners();
    }
  }

  private cleanupEventListeners(): void {
    this.context.events.close('error');
  }

  private onHttp2PushError(kind: string, error: Error): void {
    const isCanceled = error instanceof CanceledPromiseError;

    this.context.setState(ResourceState.Error);
    this.session?.emit('http-error', {
      request: MitmRequestContext.toEmittedResource(this.context),
      error,
    });

    if (!isCanceled && !this.session?.isClosing && !error[hasBeenLoggedSymbol]) {
      this.logger.info(`MitmHttpRequest.${kind}`, {
        request: `H2PUSH: ${this.context.url.href}`,
        error,
      });
    }
    this.cleanupEventListeners();
  }
}
