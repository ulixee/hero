import * as http2 from 'http2';
import { ClientHttp2Stream, ServerHttp2Stream } from 'http2';
import Log, { hasBeenLoggedSymbol } from '@secret-agent/commons/Logger';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import MitmRequestContext from '../lib/MitmRequestContext';
import BlockHandler from './BlockHandler';
import HeadersHandler from './HeadersHandler';
import ResourceState from '../interfaces/ResourceState';
import RequestSession from './RequestSession';

const { log } = Log(module);

export default class Http2PushPromiseHandler {
  private readonly context: IMitmRequestContext;
  private onResponseHeadersPromise: Promise<void>;
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
    log.info('Http2Client.pushReceived', { sessionId, requestHeaders, flags });
    serverPushStream.on('error', error => {
      log.warn('Http2.ProxyToServer.PushStreamError', {
        sessionId,
        error,
      });
    });
    this.context = MitmRequestContext.createFromHttp2Push(parentContext, rawHeaders);
    this.context.serverToProxyResponse = serverPushStream;
    this.session.trackResourceRedirects(this.context);
    this.context.setState(ResourceState.ServerToProxyPush);
    this.session.emit('request', MitmRequestContext.toEmittedResource(this.context));
  }

  public async onRequest(): Promise<void> {
    const pushContext = this.context;
    const parentContext = this.parentContext;
    const session = this.session;
    const sessionId = this.session.sessionId;
    const serverPushStream = this.context.serverToProxyResponse as http2.ClientHttp2Stream;
    const headers = this.requestHeaders;

    if (BlockHandler.shouldBlockRequest(pushContext)) {
      await pushContext.browserHasRequested;
      session.emit('response', MitmRequestContext.toEmittedResource(pushContext));
      pushContext.setState(ResourceState.Blocked);
      return serverPushStream.close(http2.constants.NGHTTP2_CANCEL);
    }

    // emit request
    if (!parentContext.isClientHttp2) {
      log.warn('Http2Client.pushReceivedWithNonH2BrowserClient', {
        sessionId,
        path: headers[':path'],
      });
      pushContext.setState(ResourceState.PrematurelyClosed);
      return serverPushStream.close(http2.constants.NGHTTP2_REFUSED_STREAM);
    }

    HeadersHandler.stripHttp1HeadersForHttp2(pushContext);
    this.onResponseHeadersPromise = new Promise<void>(resolve => {
      serverPushStream.once('push', (responseHeaders, responseFlags, responseRawHeaders) => {
        MitmRequestContext.readHttp2Response(
          pushContext,
          serverPushStream,
          responseHeaders[':status'],
          responseRawHeaders,
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
      log.warn('Http2.ClientToProxy.CreatePushStreamError', {
        sessionId,
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
    const sessionId = session.sessionId;

    if (createPushStreamError) {
      log.warn('Http2.ClientToProxy.PushStreamError', {
        sessionId,
        error: createPushStreamError,
      });
      return;
    }
    proxyToClientPushStream.on('error', pushError => {
      log.warn('Http2.ClientToProxy.PushStreamError', {
        sessionId,
        error: pushError,
      });
    });

    serverToProxyPushStream.on('headers', additional => {
      if (!proxyToClientPushStream.destroyed) proxyToClientPushStream.additionalHeaders(additional);
    });

    let trailers: http2.IncomingHttpHeaders;
    serverToProxyPushStream.once('trailers', trailerHeaders => {
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
        proxyToClientPushStream.on('wantTrailers', (): void => {
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
    }
  }

  private onHttp2PushError(kind: string, error: Error): void {
    const isCanceled = error instanceof CanceledPromiseError;

    this.context.setState(ResourceState.Error);
    this.session.emit('http-error', {
      request: MitmRequestContext.toEmittedResource(this.context),
      error,
    });

    if (!isCanceled && !this.session.isClosing && !error[hasBeenLoggedSymbol]) {
      log.info(`MitmHttpRequest.${kind}`, {
        sessionId: this.session.sessionId,
        request: `H2PUSH: ${this.context.url.href}`,
        error,
      });
    }
  }
}
