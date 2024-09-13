import Plugin from '@double-agent/collect/lib/Plugin';
import Document from '@double-agent/collect/lib/Document';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import fontScript from './fontScript';
import { IProfileData } from './interfaces/IProfile';

export default class BrowserFontsPlugin extends Plugin {
  public initialize() {
    this.registerRoute('https', '/', this.loadScript);
    this.registerRoute('https', '/save', this.save);
    this.registerPages({ route: this.routes.https['/'], waitForReady: true });
  }

  public async loadScript(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(fontScript(ctx));
    ctx.res.end(document.html);
  }

  public async save(ctx: IRequestContext): Promise<void> {
    const profileData = ctx.requestDetails.bodyJson as IProfileData;
    ctx.session.savePluginProfileData<IProfileData>(this, profileData);
    ctx.res.end();
  }
}
