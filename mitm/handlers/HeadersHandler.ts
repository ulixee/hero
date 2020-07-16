import IMitmRequestContext from '../interfaces/IMitmRequestContext';
import { IncomingMessage } from 'http';
import Log from '@secret-agent/commons/Logger';

const { log } = Log(module);
export default class HeadersHandler {
  public static async waitForResource(ctx: IMitmRequestContext) {
    const session = ctx.requestSession;

    const requestSettings = ctx.proxyToServerRequestSettings;

    if (requestSettings.method === 'OPTIONS') {
      ctx.resourceType = 'Preflight';
    } else if (ctx.resourceType === 'Websocket') {
      ctx.browserRequestId = await session.getWebsocketUpgradeRequestId(requestSettings.headers);
    } else {
      const resource = await session.waitForBrowserResourceRequest(
        ctx.url,
        requestSettings.method,
        requestSettings.headers,
      );

      if (!resource.resourceType) {
        log.error(ctx.requestSession.sessionId, 'HeadersHandler.ErrorGettingResourceType', {
          resource,
          url: ctx.url,
        });
        throw Error('No resource type found for resource');
      }
      ctx.browserRequestId = resource.browserRequestId;
      ctx.resourceType = resource.resourceType;
      ctx.originType = resource.originType;
      ctx.hasUserGesture = resource.hasUserGesture;
      ctx.isUserNavigation = resource.isUserNavigation;
      ctx.documentUrl = resource.documentUrl;
      if (session.delegate?.documentHasUserActivity) {
        const hasUserActivity = !!ctx.clientToProxyRequest.headers['Sec-Fetch-User'];
        if (hasUserActivity) {
          await session.delegate?.documentHasUserActivity(resource.documentUrl);
        }
      }
    }
  }

  public static modifyHeaders(ctx: IMitmRequestContext, request: IncomingMessage) {
    const session = ctx.requestSession;
    if (!session || !session.delegate?.modifyHeadersBeforeSend) return;

    const updatedHeaders = session.delegate.modifyHeadersBeforeSend(
      session.sessionId,
      ctx.resourceType,
      ctx.isSSL,
      request.method,
      ctx.originType,
      ctx.proxyToServerRequestSettings.headers,
    );
    if (updatedHeaders) ctx.proxyToServerRequestSettings.headers = updatedHeaders;
  }

  public static restorePreflightHeader(ctx: IMitmRequestContext) {
    if (
      ctx.clientToProxyRequest.method === 'OPTIONS' &&
      ctx.clientToProxyRequest.headers['access-control-request-headers']
    ) {
      const settingBeforeSend = ctx.clientToProxyRequest.headers[
        'access-control-request-headers'
      ] as string;
      if (settingBeforeSend) {
        ctx.serverToProxyResponse.headers['access-control-allow-headers'] = settingBeforeSend;
        let wasFound = false;
        for (let i = 0; i < ctx.serverToProxyResponse.rawHeaders.length; i += 2) {
          if (
            ctx.serverToProxyResponse.rawHeaders[i].toLowerCase() === 'access-control-allow-headers'
          ) {
            ctx.serverToProxyResponse.rawHeaders[i + 1] = settingBeforeSend;
            wasFound = true;
          }
        }
        if (!wasFound) {
          ctx.serverToProxyResponse.rawHeaders.push(
            'access-control-allow-headers',
            settingBeforeSend,
          );
        }
      }
    }
  }
}
