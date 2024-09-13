import Plugin, { IPluginPage } from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Document from '@double-agent/collect/lib/Document';
import ResourceType from '@double-agent/collect/interfaces/ResourceType';
import { IProfileData } from './interfaces/IProfile';
import websocketsScript from './websocketsScript';

export default class HttpHeadersPlugin extends Plugin {
  public initialize() {
    this.registerRoute('allHttp1', '/', this.start);
    this.registerRoute('ws', '/ws', this.onConnection);

    const pages: IPluginPage[] = [];

    ['http', 'https'].forEach(protocol => {
      pages.push({ route: this.routes[protocol]['/'], waitForReady: true });
    });

    this.registerPages(...pages);
  }

  public start(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(websocketsScript(ctx));
    ctx.res.end(document.html);
  }

  public onConnection(ctx: IRequestContext) {
    saveHeadersToProfile(this, ctx);
  }
}

/////// /////////////////

function saveHeadersToProfile(plugin: Plugin, ctx: IRequestContext) {
  const pathname = ctx.url.pathname;
  const { domainType, originType, method, referer } = ctx.requestDetails;
  const protocol = ctx.server.protocol;
  const pageName = undefined;
  const rawHeaders: string[][] = [];
  for (let i = 0; i < ctx.req.rawHeaders.length; i += 2) {
    const key = ctx.req.rawHeaders[i];
    const value = ctx.req.rawHeaders[i + 1];
    rawHeaders.push([key, value]);
  }

  const profileData = ctx.session.getPluginProfileData<IProfileData>(plugin, []);
  profileData.push({
    pageName,
    method,
    protocol,
    domainType,
    isRedirect: ctx.page?.isRedirect ?? false,
    resourceType: ResourceType.WebsocketUpgrade,
    originType,
    pathname,
    referer,
    rawHeaders,
  });
  ctx.session.savePluginProfileData<IProfileData>(plugin, profileData, {
    keepInMemory: true,
  });
}
