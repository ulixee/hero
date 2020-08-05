import RequestSession from './RequestSession';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';

export default class BlockHandler {
  public static shouldBlockRequest(session: RequestSession, ctx: IMitmRequestContext) {
    if (!session) return false;
    if (session.isClosing) return true;

    const shouldBlock =
      (session.blockImages && ctx.resourceType === 'Image') || session.shouldBlockRequest(ctx.url);

    if (!shouldBlock) return false;

    ctx.didBlockResource = shouldBlock;

    let contentType = 'text/html';
    if (ctx.resourceType === 'Image') {
      contentType = `image/${ctx.url.split('.').pop()}`;
    }

    if (ctx.proxyToClientResponse) {
      if (session.blockHandler(ctx.clientToProxyRequest, ctx.proxyToClientResponse)) {
        return true;
      }

      ctx.proxyToClientResponse.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      ctx.proxyToClientResponse.end();
    }
    // don't proceed
    return true;
  }
}
