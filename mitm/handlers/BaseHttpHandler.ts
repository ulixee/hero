import Log from '@secret-agent/commons/Logger';
import http from 'http';
import http2 from 'http2';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import BlockHandler from './BlockHandler';
import HeadersHandler from './HeadersHandler';
import CookieHandler from './CookieHandler';
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
      session.trackResource(this.context);
      session.emit('request', MitmRequestContext.toEmittedResource(this.context));

      if (session.isClosing) return context.setState(ResourceState.SessionClosed);

      if (BlockHandler.shouldBlockRequest(context)) {
        context.setState(ResourceState.Blocked);
        log.info(`Http.RequestBlocked`, {
          sessionId: session.sessionId,
          url: context.url.href,
        });
        await HeadersHandler.waitForBrowserRequest(context);
        session.emit('response', MitmRequestContext.toEmittedResource(this.context));
        // already wrote reply
        return;
      }

      await HeadersHandler.waitForBrowserRequest(context);
      await CookieHandler.setProxyToServerCookies(context);

      // do one more check on the session before doing a connect
      if (session.isClosing) return context.setState(ResourceState.SessionClosed);

      this.context.proxyToServerRequest = await session.requestAgent.request(context);
      this.context.proxyToServerRequest.on(
        'error',
        this.onError.bind(this, 'ProxyToServer.RequestError'),
      );

      return this.context.proxyToServerRequest;
    } catch (err) {
      this.onError('ProxyToServer.RequestHandlerError', err);
    }
  }
}
