import IEmulatorProfile from '@unblocked-web/emulator-spec/emulator/IEmulatorProfile';
import IHttp2ConnectSettings from '@unblocked-web/emulator-spec/net/IHttp2ConnectSettings';
import IHttpResourceLoadDetails from '@unblocked-web/emulator-spec/net/IHttpResourceLoadDetails';
import IBrowserData from '../../interfaces/IBrowserData';

export default function configureHttp2Session(
  emulatorProfile: IEmulatorProfile,
  data: IBrowserData,
  resource: IHttpResourceLoadDetails,
  settings: IHttp2ConnectSettings,
): void {
  settings.localWindowSize = data.http2Settings.firstFrameWindowSize;
  settings.settings = data.http2Settings.settings;
}
