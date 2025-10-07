import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import ResourceState from '../interfaces/ResourceState';

export default class InterceptorHandler {
  public static async shouldIntercept(ctx: IMitmRequestContext): Promise<boolean> {
    ctx.setState(ResourceState.InterceptHandler);
    const requestSession = ctx.requestSession;
    if (!requestSession) return false;
    if (requestSession.isClosing) return false;

    const shouldIntercept = await requestSession.willInterceptRequest(ctx.url, ctx.resourceType);

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
        ctx.responseHeaders ??= ctx.proxyToClientResponse.getHeaders() as any;
        ctx.responseTime ??= Date.now();
        ctx.status ??= ctx.proxyToClientResponse.statusCode;
        ctx.statusMessage ??= ctx.proxyToClientResponse.statusMessage;
        ctx.didInterceptResource = true;
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
