import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import IHttp2ConnectSettings from '@ulixee/unblocked-specification/agent/net/IHttp2ConnectSettings';
import IHttpResourceLoadDetails from '@ulixee/unblocked-specification/agent/net/IHttpResourceLoadDetails';
import IBrowserData from '../../interfaces/IBrowserData';

export default function configureHttp2Session(
  emulationProfile: IEmulationProfile,
  data: IBrowserData,
  resource: IHttpResourceLoadDetails,
  settings: IHttp2ConnectSettings,
): void {
  settings.localWindowSize = data.http2Settings.firstFrameWindowSize;
  settings.settings = data.http2Settings.settings;
}
