import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import IResourceRequest from '@secret-agent/core-interfaces/IResourceRequest';

export default class RequestEmitter {
  public static emitHttpResponse(ctx: IMitmRequestContext, body: Buffer) {
    if (!ctx.requestSession) return;

    // broadcast session
    const request = {
      url: ctx.url,
      headers: ctx.proxyToServerRequestSettings.headers,
      method: ctx.clientToProxyRequest.method,
      postData: ctx.postData,
      timestamp: ctx.requestTime.toISOString(),
    } as IResourceRequest;

    ctx.requestSession.emit('response', {
      browserRequestId: ctx.browserRequestId,
      request,
      response: ctx.serverToProxyResponse,
      wasCached: ctx.cacheHandler.didUseArtificialCache,
      resourceType: ctx.resourceType,
      remoteAddress: ctx.remoteAddress,
      requestTime: ctx.requestTime,
      body,
    });
  }
}
