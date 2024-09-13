import * as fs from 'fs';
import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Plugin from '@double-agent/collect/lib/Plugin';
import Document from '@double-agent/collect/lib/Document';
import { IProfileData, IProfileDataFingerprint } from './interfaces/IProfile';
import fingerprintScript from './fingerprintScript';

const fingerprintJs = fs.readFileSync(require.resolve('fingerprintjs2/dist/fingerprint2.min.js'));

export default class BrowserFingerprintPlugin extends Plugin {
  public initialize() {
    this.registerRoute('https', '/first', this.loadFingerprint);
    this.registerRoute('https', '/second', this.loadFingerprint);
    this.registerRoute('https', '/fingerprint.js', this.fingerprintJs);
    this.registerRoute('https', '/save', this.save);

    this.registerPages(
      { route: this.routes.https['/first'], waitForReady: true },
      { route: this.routes.https['/second'], waitForReady: true },
    );

    this.registerPagesOverTime({ route: this.routes.https['/first'], waitForReady: true });
  }

  private loadFingerprint(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(fingerprintScript(ctx));
    document.injectHeadTag(
      `<script src="${ctx.buildUrl('/fingerprint.js')}" type="text/javascript"></script>`,
    );
    ctx.res.end(document.html);
  }

  private async fingerprintJs(ctx: IRequestContext) {
    ctx.res.writeHead(200, { 'Content-Type': 'text/javascript' });
    ctx.res.end(fingerprintJs);
  }

  private async save(ctx: IRequestContext) {
    const fingerprint = ctx.requestDetails.bodyJson as IProfileDataFingerprint;
    const index = extractArrayIndex((fingerprint as any).originatedAt);
    const profileData = ctx.session.getPluginProfileData<IProfileData>(this, []);
    const isFirstFingerprint = index === 0;

    profileData[index] = fingerprint;
    ctx.session.savePluginProfileData<IProfileData>(this, profileData, {
      keepInMemory: isFirstFingerprint,
    });
    ctx.res.end();
  }
}

function extractArrayIndex(originatedAt: string): 0 | 1 {
  if (originatedAt.includes('/first')) {
    return 0;
  }
  if (originatedAt.includes('/second')) {
    return 1;
  }
  throw new Error(`Could not extract array index from path: ${originatedAt}`);
}
