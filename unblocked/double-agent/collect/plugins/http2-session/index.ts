import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Http2Server from '@double-agent/collect/servers/Http2Server';
import Document from '@double-agent/collect/lib/Document';
import Config from '@double-agent/config/index';
import { IProfileData } from './interfaces/IProfile';

const { MainDomain } = Config.collect.domains;

export default class Http2SessionPlugin extends Plugin {
  public initialize() {
    this.registerRoute('http2', '/', this.load);
    this.registerRoute('http2', '/wait', this.wait);
    this.registerRoute('http2', '/wait2', this.wait);
    this.registerPages(
      {
        route: this.routes.http2['/wait'],
        domain: MainDomain,
        waitForReady: true,
      },
      {
        route: this.routes.http2['/wait2'],
        domain: MainDomain,
        waitForReady: true,
      },
      {
        route: this.routes.http2['/'],
        domain: MainDomain,
        waitForReady: true,
      },
    );
  }

  public async load(ctx: IRequestContext) {
    this.saveSessions(ctx);

    const document = new Document(ctx);
    document.addNextPageClick();
    ctx.res.end(document.html);
  }

  public async wait(ctx: IRequestContext) {
    this.saveSessions(ctx);

    const document = new Document(ctx);
    document.addNextPageClick();
    // https://github.com/chromium/chromium/blob/99314be8152e688bafbbf9a615536bdbb289ea87/net/spdy/spdy_session.cc#L92
    document.injectBodyTag(`<script type="text/javascript">
         // give 10 seconds for ping to run
         const wait = new Promise(resolve => {
          setTimeout(() => resolve(), 10000);
        });
        window.pageQueue.push(wait);
    </script>`);
    ctx.res.end(document.html);
  }

  private saveSessions(ctx: IRequestContext) {
    const server = ctx.server as Http2Server;
    const id = ctx.session.id;
    const sessionParam = `sessionId=${id}`;
    const profileData = <IProfileData>{
      sessions: [],
    };
    for (const session of server.sessions) {
      const isMatch = session.activity.some((x) => x.data?.path?.includes(sessionParam));

      if (isMatch) {
        profileData.sessions.push({
          activity: session.activity,
          id: session.id,
          origins: session.session.originSet,
        });
      }
    }
    ctx.session.savePluginProfileData<IProfileData>(this, profileData);
  }
}
