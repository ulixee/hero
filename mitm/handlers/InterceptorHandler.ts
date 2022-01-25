import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';

export default class InterceptorHandler {
  public static async shouldIntercept(ctx: IMitmRequestContext): Promise<boolean> {
    ctx.setState(ResourceState.InterceptHandler);
    const requestSession = ctx.requestSession;
    if (!requestSession) return false;
    if (requestSession.isClosing) return false;

    const shouldIntercept =
      (ctx.resourceType &&
        requestSession.interceptorHandlers?.some(x => x.types?.includes(ctx.resourceType))) ||
      requestSession.shouldInterceptRequest(ctx.url.href);

    if (!shouldIntercept) return false;
    ctx.didInterceptResource = shouldIntercept;

    if (ctx.proxyToClientResponse) {
      if (
        await requestSession.didHandleInterceptResponse(
          ctx,
          ctx.clientToProxyRequest,
          ctx.proxyToClientResponse,
        )
      ) {
        return true;
      }

      let contentType = 'text/html';
      if (ctx.resourceType === 'Image') {
        contentType = `image/${ctx.url.pathname.split('.').pop()}`;
      }

      ctx.proxyToClientResponse.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      ctx.proxyToClientResponse.end('');
    }
    // don't proceed
    return true;
  }
}
