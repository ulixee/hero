import {
  BrowserEmulatorClassDecorator,
  IBrowserEmulator,
  IBrowserEmulatorConfig,
} from '@secret-agent/interfaces/IPluginBrowserEmulator';
import { PluginTypes } from '@secret-agent/interfaces/IPluginTypes';
import IUserAgentOption from '@secret-agent/interfaces/IUserAgentOption';
import DefaultBrowserEmulator from '@secret-agent/default-browser-emulator';

const id = 'test';
const locale = 'en';
const timezoneId = 'est';
const viewport = {
  screenHeight: 900,
  screenWidth: 1024,
  positionY: 0,
  positionX: 0,
  height: 900,
  width: 1024,
};

const userAgentOption: IUserAgentOption = {
  browserName: 'chrome',
  browserVersion: {
    major: '88',
    minor: '0',
  },

  operatingSystemPlatform: 'linux',
  operatingSystemName: 'linux',
  operatingSystemVersion: {
    major: '10',
    minor: '0',
  },

  string: 'Puppet Test',
};

@BrowserEmulatorClassDecorator
export default class CustomBrowserEmulator implements IBrowserEmulator {
  static id = id;
  static pluginType: PluginTypes.BrowserEmulator = PluginTypes.BrowserEmulator;

  id = id;
  browserName = userAgentOption.browserName;
  browserVersion = userAgentOption.browserVersion;
  operatingSystemPlatform = userAgentOption.operatingSystemPlatform;
  operatingSystemName = userAgentOption.operatingSystemName;
  operatingSystemVersion = userAgentOption.operatingSystemVersion;
  userAgentString = userAgentOption.string;

  locale = locale;
  viewport = viewport;
  timezoneId = timezoneId;

  configure(config: IBrowserEmulatorConfig): void {
    config.locale = config.locale || this.locale;
    config.viewport = config.viewport || this.viewport;
    config.timezoneId = config.timezoneId || this.timezoneId;

    this.locale = config.locale;
    this.viewport = config.viewport;
    this.timezoneId = config.timezoneId;
  }

  async onNewPuppetPage(page) {
    const devtools = page.devtoolsSession;
    return Promise.all([
      devtools.send('Network.setUserAgentOverride', {
        userAgent: this.userAgentString,
        acceptLanguage: this.locale,
        platform: this.operatingSystemPlatform,
      }),
      devtools
        .send('Emulation.setTimezoneOverride', { timezoneId: this.timezoneId })
        .catch(() => null),
      devtools.send('Emulation.setLocaleOverride', { locale: this.locale }).catch(err => err),
      this.viewport
        ? devtools
            .send('Emulation.setDeviceMetricsOverride', {
              width: this.viewport.width,
              height: this.viewport.height,
              deviceScaleFactor: 1,
              positionX: this.viewport.positionX,
              positionY: this.viewport.positionY,
              screenWidth: this.viewport.screenWidth,
              screenHeight: this.viewport.screenHeight,
              mobile: false,
            })
            .catch(() => null)
        : null,
      devtools.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(err => err),
    ]);
  }

  static selectBrowserMeta(userAgentSelector?: string) {
    return DefaultBrowserEmulator.selectBrowserMeta(userAgentSelector);
  }
}
