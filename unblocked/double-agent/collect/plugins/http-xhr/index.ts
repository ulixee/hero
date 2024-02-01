import * as Fs from 'fs';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Document from '@double-agent/collect/lib/Document';
import Plugin, { IPluginPage } from '@double-agent/collect/lib/Plugin';
import * as Path from 'path';
import { IProfileData } from './interfaces/IProfile';
import xhrScript from './xhrScript';

const axiosPath = require.resolve('axios').replace( `dist${Path.sep}node${Path.sep}axios`,`dist${Path.sep}browser${Path.sep}axios`);
const axiosJs = Fs.readFileSync(axiosPath);
const axiosSourceMap = Fs.readFileSync(`${axiosPath}.map`);

export default class HttpHeadersPlugin extends Plugin {
  public initialize() {
    this.registerRoute('all', '/run', this.run);

    this.registerAsset('all', '/axios.js', this.axiosJs);
    this.registerAsset('all', '/axios.min.map', this.axiosSourceMap);

    this.registerRoute(
      'all',
      '/axios-nocustom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    this.registerRoute(
      'all',
      '/axios-custom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    this.registerRoute(
      'all',
      '/fetch-nocustom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    this.registerRoute(
      'all',
      '/fetch-post-nocustom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    this.registerRoute(
      'all',
      '/post-nocustom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    this.registerRoute(
      'all',
      '/fetch-custom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    this.registerRoute(
      'all',
      '/fetch-post-custom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    this.registerRoute(
      'all',
      '/post-custom-headers.json',
      this.saveHeaders,
      this.savePreflightHeaders,
    );
    const pages: IPluginPage[] = [];

    ['http', 'https', 'http2'].forEach(protocol => {
      pages.push({ route: this.routes[protocol]['/run'], waitForReady: true });
    });

    this.registerPages(...pages);
  }

  public run(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectHeadTag('<script src="/axios.js"></script>');
    document.injectBodyTag(xhrScript(ctx));
    ctx.res.end(document.html);
  }

  public savePreflightHeaders(ctx: IRequestContext) {
    saveHeadersToProfile(this, ctx);
  }

  public saveHeaders(ctx: IRequestContext) {
    saveHeadersToProfile(this, ctx);
    const headers: any = { 'Content-Type': 'application/javascript' };
    if (ctx.req.headers.origin) {
      headers['Access-Control-Allow-Origin'] = ctx.req.headers.origin;
    }
    ctx.res.writeHead(200, headers);
    ctx.res.end('true');
  }

  public axiosJs({ res }) {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(axiosJs);
  }

  public axiosSourceMap({ res }) {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    res.end(axiosSourceMap);
  }
}

/////// /////////////////

function saveHeadersToProfile(plugin: Plugin, ctx: IRequestContext) {
  const pathname = ctx.url.pathname;
  const { domainType, originType, method, referer, resourceType } = ctx.requestDetails;
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
    originType,
    resourceType,
    isRedirect: ctx.page?.isRedirect ?? false,
    pathname,
    referer,
    rawHeaders,
  });
  ctx.session.savePluginProfileData<IProfileData>(plugin, profileData, {
    keepInMemory: true,
  });
}
