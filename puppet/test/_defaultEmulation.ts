import IBrowserEmulator from '@secret-agent/interfaces/IBrowserEmulator';

const defaultEmulation = {
  canPolyfill: false,
  configuration: {
    locale: 'en',
    viewport: {
      screenHeight: 900,
      screenWidth: 1024,
      positionY: 0,
      positionX: 0,
      height: 900,
      width: 1024,
      scale: 1,
    },
  },
  sessionId: '',
  configure(): Promise<void> {
    return null;
  },
  osPlatform: 'linux',
  userAgentString: 'Puppet Test',
  async onNewPuppetPage(page) {
    const devtools = page.devtoolsSession;
    const viewport = this.configuration.viewport;
    return Promise.all([
      devtools.send('Network.setUserAgentOverride', {
        userAgent: this.userAgentString,
        acceptLanguage: this.configuration.locale,
        platform: this.osPlatform,
      }),
      devtools
        .send('Emulation.setTimezoneOverride', { timezoneId: this.configuration.timezoneId })
        .catch(() => null),
      devtools
        .send('Emulation.setLocaleOverride', { locale: this.configuration.locale })
        .catch(err => err),
      viewport
        ? devtools
            .send('Emulation.setDeviceMetricsOverride', {
              width: viewport.width,
              height: viewport.height,
              deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
              positionX: viewport.positionX,
              positionY: viewport.positionY,
              screenWidth: viewport.screenWidth,
              screenHeight: viewport.screenHeight,
              mobile: false,
            })
            .catch(() => null)
        : null,
      devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err),
    ]);
  },
} as IBrowserEmulator;

export default defaultEmulation;
