import IRequestContext from '@double-agent/collect/interfaces/IRequestContext';
import Plugin from '@double-agent/collect/lib/Plugin';
import Document from '@double-agent/collect/lib/Document';
import IWebRTCCodec from './interfaces/IWebRTCCodec';
import { IProfileData } from './interfaces/IProfile';
import codecPageScript from './codecPageScript';

export default class BrowserCodecsPlugin extends Plugin {
  public initialize() {
    this.registerRoute('https', '/', this.loadScript);
    this.registerRoute('https', '/save', this.save);
    this.registerPages({ route: this.routes.https['/'], waitForReady: true });
  }

  private loadScript(ctx: IRequestContext) {
    const document = new Document(ctx);
    document.injectBodyTag(codecPageScript(ctx));
    ctx.res.end(document.html);
  }

  private async save(ctx: IRequestContext) {
    const profileData = cleanProfileData(ctx.requestDetails.bodyJson as IProfileData);
    ctx.session.savePluginProfileData<IProfileData>(this, profileData);
    ctx.res.end();
  }
}

function cleanProfileData(profile: IProfileData) {
  profile.audioSupport.probablyPlays.sort();
  profile.audioSupport.maybePlays.sort();
  profile.audioSupport.recordingFormats.sort();
  profile.videoSupport.probablyPlays.sort();
  profile.videoSupport.maybePlays.sort();
  profile.videoSupport.recordingFormats.sort();
  profile.webRtcAudioCodecs.sort(webRtcSort);
  profile.webRtcVideoCodecs.sort(webRtcSort);
  return profile;
}

function webRtcSort(a: IWebRTCCodec, b: IWebRTCCodec) {
  const mimeCompare = (a.mimeType ?? '').localeCompare(b.mimeType ?? '');
  if (mimeCompare !== 0) return mimeCompare;
  const clockCompare = a.clockRate - b.clockRate;
  if (clockCompare !== 0) return clockCompare;
  return (a.sdpFmtpLine ?? '').localeCompare(b.sdpFmtpLine ?? '');
}
