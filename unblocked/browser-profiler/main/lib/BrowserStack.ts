import Axios from 'axios';
import * as webdriver from 'selenium-webdriver';
import IBrowser from '@ulixee/real-user-agents/interfaces/IBrowser';
import IOperatingSystem from '@ulixee/real-user-agents/interfaces/IOperatingSystem';
import SeleniumRunner from '@ulixee/double-agent-stacks/lib/SeleniumRunner';
import IBrowserstackAgent from '../interfaces/IBrowserstackAgent';
import env from '../env';

export default class BrowserStack {
  static supportedCapabilities = [];

  public static async buildWebDriver(
    browser: IBrowserstackAgent,
    customCapabilities: any = {},
  ): Promise<webdriver.WebDriver> {
    const capabilities: webdriver.Capabilities = {
      ...browser,
      ...browserstackSettings,
      'browserstack.selenium_version': getSeleniumVersion(browser),
      ...customCapabilities,
      acceptSslCert: shouldBypassSecurity(browser),
      browserName: browser.browser,
      chromeOptions: getChromeOptions(browser),
    };

    try {
      return await SeleniumRunner.createDriver(
        'http://hub-cloud.browserstack.com/wd/hub',
        capabilities,
      );
    } catch (err) {
      console.log(capabilities);
      console.log(err);
      console.log("Couldn't build driver for %s", browser);
    }

    return null;
  }

  public static async createAgent(
    os: IOperatingSystem,
    browser: IBrowser,
  ): Promise<IBrowserstackAgent> {
    let osVersion = os.version.name;
    if (!osVersion) {
      osVersion = os.version.major;
      if (os.version.minor && os.version.minor !== '0') {
        osVersion += `.${os.version.minor}`;
      }
    }
    const agent = {
      browser: browser.name,
      browser_version: `${browser.version.major}.${browser.version.minor}`,
      os: os.name.replace('Mac OS', 'OS X'),
      os_version: osVersion,
    };
    if (await this.isBrowserSupported(agent)) {
      return agent;
    }

    console.log("BrowserStack doesn't support", browser.id, os.id);
    return null;
  }

  static async getCapabilities(): Promise<IBrowserstackAgent[]> {
    if (!this.supportedCapabilities.length) {
      this.supportedCapabilities = await Axios.get(
        'https://api.browserstack.com/automate/browsers.json',
        {
          auth: {
            password: browserstackSettings['browserstack.key'],
            username: browserstackSettings['browserstack.user'],
          },
        },
      ).then(x => x.data);
    }
    return this.supportedCapabilities;
  }

  private static async isBrowserSupported(agent: IBrowserstackAgent): Promise<IBrowserstackAgent> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { os, os_version, browser, browser_version } = agent;
    const capabilities = await BrowserStack.getCapabilities();
    return capabilities.find(x => {
      return (
        x.os === os &&
        x.os_version === os_version &&
        x.browser === browser.toLowerCase() &&
        (x.browser_version === browser_version || x.browser_version === `${browser_version}.0`)
      );
    });
  }
}

const browserstackSettings = {
  resolution: '1024x768',
  'browserstack.user': env.browserStackUser,
  'browserstack.key': env.browserStackKey,
  'browserstack.idleTimeout': 300,
  'browserstack.safari.allowAllCookies': 'true',
  'browserstack.debug': 'true', // Enabling visual logs
  'browserstack.seleniumLogs': 'true',
  'browserstack.console': 'verbose', // Enabling console logs
  'browserstack.networkLogs': 'false', // Enabling network logs for the test
  checkURL: 'false',
  buildName: 'Profiles',
  projectName: 'Double Agent',
};

function getChromeOptions({ browser, browser_version }: IBrowserstackAgent): {
  args: string[];
  excludeSwitches: string[];
} {
  const [majorVersion] = browser_version.split('.').map(x => Number(x));
  const args: string[] = [
    '--disable-blink-features=AutomationControlled',
    '--disable-site-isolation-trials',
  ];
  if (browser === 'Chrome' && majorVersion >= 80 && majorVersion < 84) {
    args.push('--enable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure');
  }
  return {
    args,
    excludeSwitches: [
      'enable-automation',
      'disable-background-networking',
      'safebrowsing-disable-auto-update',
    ],
  };
}

function shouldBypassSecurity({ os, os_version }): boolean {
  // El Capitan has a root cert issue that doesn't work with LetsEncrypt certs (says connection is not private)
  if (os === 'OS X' && (os_version === 'El Capitan' || os_version === 'Yosemite')) {
    return true;
  }
  return false;
}

function getSeleniumVersion({
  browser,
  browser_version,
  os,
  os_version,
}: IBrowserstackAgent): string {
  const [majorVersion] = browser_version.split('.').map(x => Number(x));
  if (
    os === 'OS X' &&
    os_version === 'Snow Leopard' &&
    browser === 'Safari' &&
    browser_version === '5.1'
  ) {
    return '2.5';
  }
  if (
    os === 'OS X' &&
    os_version === 'Mountain Lion' &&
    browser === 'Safari' &&
    browser_version === '6.2'
  ) {
    return '3.5.2';
  }
  if (os === 'OS X' && os_version === 'Snow Leopard') {
    return '2.46.0';
  }
  if (browser === 'Opera') {
    return '2.43.1';
  }
  if (
    browser === 'Firefox' &&
    browser_version === '4.0' &&
    os === 'OS X' &&
    os_version === 'Lion'
  ) {
    return '2.37.0';
  }
  if (browser === 'Firefox' && os_version === 'XP') {
    return '2.53.1';
  }
  if (browser === 'Firefox' && majorVersion < 45) {
    return '2.53.1';
  }
  if (browser === 'Firefox' && majorVersion <= 52) {
    return '3.2.0';
  }
  if (browser === 'Chrome' && majorVersion < 45) {
    return '2.37.0';
  }
  return undefined;
}
