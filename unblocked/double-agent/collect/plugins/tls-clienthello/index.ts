import Plugin from '@double-agent/collect/lib/Plugin';
import IRequestTlsContext from '@double-agent/collect/interfaces/IRequestTlsContext';
import { IProfileData } from './interfaces/IProfile';

export default class TlsClienthelloPlugin extends Plugin {
  public initialize() {
    this.registerRoute('tls', '/', this.save);
    this.registerPages({ route: this.routes.tls['/'] });
  }

  public async save(ctx: IRequestTlsContext) {
    const profileData = {
      clientHello: ctx.req.clientHello,
    };

    ctx.session.savePluginProfileData<IProfileData>(this, profileData);
    ctx.res.end('Done');
  }
}
