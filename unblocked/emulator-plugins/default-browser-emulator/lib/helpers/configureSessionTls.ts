import IEmulatorProfile from '@unblocked-web/emulator-spec/emulator/IEmulatorProfile';
import ITlsSettings from '@unblocked-web/emulator-spec/net/ITlsSettings';

export default function configureSessionTcp(
  emulatorProfile: IEmulatorProfile,
  settings: ITlsSettings,
): void {
  const { browserName, browserVersion } = emulatorProfile.userAgentOption;
  settings.tlsClientHelloId = `${browserName}-${browserVersion.major}`;
}
