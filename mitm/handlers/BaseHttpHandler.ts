import Log from '@secret-agent/commons/Logger';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import BlockHandler from './BlockHandler';
import HeadersHandler from './HeadersHandler';
import CookieHandler from './CookieHandler';
import MitmRequestContext from '../lib/MitmRequestContext';
import HttpResponseCache from '../lib/HttpResponseCache';

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

  protected async createProxyToServerRequest() {
    const context = this.context;
    const session = context.requestSession;

    try {
      // track request
      session.trackResource(this.context);
      session.emit('request', MitmRequestContext.toEmittedResource(this.context));

      log.info(`Http.Request`, {
        sessionId: session.sessionId,
        url: context.url.href,
        method: context.method,
        ws: context.isUpgrade,
      });
      if (session.isClosing) return;

      if (BlockHandler.shouldBlockRequest(context)) {
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

      context.cacheHandler.onRequest();

      // do one more check on the session before doing a connect
      if (session.isClosing) return;

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
