import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Document from '@double-agent/collect/lib/Document';
import { IProfileData, IVoice } from './interfaces/IProfile';
import script from './script';

export default class BrowserSpeechPlugin extends Plugin {
  public initialize() {
    for (const protocol of ['http', 'https']) {
      this.registerRoute(protocol as any, '/', this.loadScript);
      this.registerRoute(protocol as any, '/save', this.save);
      this.registerPages({
        route: this.routes[protocol]['/'],
        waitForReady: true,
      });
    }
  }

  private loadScript(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(script(ctx));
    ctx.res.end(document.html);
  }

  private async save(ctx: IRequestContext) {
    // TODO: voices don't always work on browserstack. can't figure out why
    const voices = (ctx.requestDetails.bodyJson as IVoice[]) ?? [];
    const profile = ctx.session.getPluginProfileData<IProfileData>(this, {});
    profile[ctx.server.protocol] = voices;
    ctx.session.savePluginProfileData(this, profile);
    ctx.res.setHeader('content-type', 'text/plain')
    ctx.res.end('ok');
  }
}
