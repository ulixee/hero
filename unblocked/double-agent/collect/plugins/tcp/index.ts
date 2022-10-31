import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Plugin from '@double-agent/collect/lib/Plugin';
import Document from '@double-agent/collect/lib/Document';
import { IProfileData } from './interfaces/IProfile';
import trackRemoteTcpVars from './lib/trackRemoteTcpVars';

export default class TcpPlugin extends Plugin {
  private tracker: any;

  public initialize() {
    this.registerRoute('https', '/', this.extractData);

    this.onServerStart('https', () => {
      this.tracker = trackRemoteTcpVars(this.httpsServer.port);
      if (this.tracker.hasError) {
        console.log(
          '------------- ERROR Starting TTL Tracker -------------\nTry starting server with sudo',
        );
      }
    });

    this.onServerStop('https', () => {
      if (this.tracker) this.tracker.stop();
    });

    this.registerPages({ route: this.routes.https['/'] });
  }

  public async extractData(ctx: IRequestContext) {
    if (this.tracker.hasError) {
      ctx.res.end();
      return;
    }

    const profileData = await this.tracker.getPacket(ctx.requestDetails.remoteAddress);
    ctx.session.savePluginProfileData<IProfileData>(this, profileData);

    const document = new Document(ctx);
    ctx.res.end(document.html);
  }
}
