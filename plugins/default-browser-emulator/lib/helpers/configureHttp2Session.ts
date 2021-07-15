import { IBrowserEmulator } from '@ulixee/hero-plugin-utils';
import IHttp2ConnectSettings from '@ulixee/hero-interfaces/IHttp2ConnectSettings';
import IHttpResourceLoadDetails from '@ulixee/hero-interfaces/IHttpResourceLoadDetails';
import IBrowserData from '../../interfaces/IBrowserData';

export default function configureHttp2Session(
  emulator: IBrowserEmulator,
  data: IBrowserData,
  resource: IHttpResourceLoadDetails,
  settings: IHttp2ConnectSettings,
) {
  settings.localWindowSize = data.http2Settings.firstFrameWindowSize;
  settings.settings = data.http2Settings.settings;
}
