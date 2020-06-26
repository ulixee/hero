import Log from '@secret-agent/commons/Logger';
import IMitmRequestContext from '../interfaces/IMitmRequestContext';

const { log } = Log(module);

export default class CookieHandler {
  public static async setProxyToServerCookies(ctx: IMitmRequestContext) {
    const session = ctx.requestSession;
    if (!session || !session.delegate?.getCookieHeader) return;
    // never send cookies to preflight requests
    if (ctx.clientToProxyRequest.method === 'OPTIONS') return;

    const cookieHeader = await session.delegate.getCookieHeader(ctx);
    setCookies(ctx.proxyToServerRequestSettings.headers, cookieHeader);
  }

  public static async readServerResponseCookies(ctx: IMitmRequestContext) {
    const session = ctx.requestSession;
    if (!session || !session.delegate?.setCookie) return;

    if (ctx.resourceType === 'Document' && ctx.serverToProxyResponse.statusCode === 200) {
      await session.delegate?.documentHasUserActivity(ctx.url);
    }

    for (const setCookie of ctx.serverToProxyResponse.headers['set-cookie'] ?? []) {
      try {
        await session.delegate.setCookie(setCookie, ctx, ctx.serverToProxyResponse.statusCode);
      } catch (err) {
        log.warn('Could not set cookie', err);
      }
    }
  }
}

function setCookies(headers: { [name: string]: string }, cookieHeader: string) {
  const existingCookies = (headers.Cookie ?? headers.cookie) || '';
  if (existingCookies !== cookieHeader) {
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    } else {
      delete headers.Cookie;
    }
  }
}
