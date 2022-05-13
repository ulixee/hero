import { existsSync } from 'fs';
import IBrowserEngine from '@unblocked-web/emulator-spec/browser/IBrowserEngine';
import IBrowserEngineOption from '@unblocked-web/emulator-spec/browser/IBrowserEngineOption';
import ChromeApp from '@ulixee/chrome-app';

export default class BrowserEngine implements IBrowserEngine {
  public name: string;
  public fullVersion: string;
  public executablePath: string;
  public executablePathEnvVar: string;
  public userDataDir?: string;

  public readonly launchArguments: string[] = [];

  public isHeaded?: boolean;
  public isInstalled: boolean;
  public doesBrowserAnimateScrolling = false;

  private engineOption: IBrowserEngineOption;
  private readonly engineFetcher: ChromeApp;

  constructor(browserEngineOption: IBrowserEngineOption) {
    // figure out which one is closest to installed?
    this.engineFetcher = this.loadEngineFetcher(browserEngineOption);
    if (this.engineFetcher.launchArgs?.length) {
      this.launchArguments.push(...this.engineFetcher.launchArgs);
    }
    this.engineOption = browserEngineOption;
    this.name = browserEngineOption.name;
    this.fullVersion = this.engineFetcher.fullVersion;

    const version = browserEngineOption.fullVersion.split('.').map(Number);
    // changes at version 90
    this.doesBrowserAnimateScrolling = version[0] >= 91;
    this.executablePath = this.engineFetcher.executablePath;
    this.executablePathEnvVar = this.engineFetcher.executablePathEnvVar;
    this.isInstalled = this.engineFetcher.isInstalled;
  }

  public async verifyLaunchable(): Promise<void> {
    if (!existsSync(this.executablePath)) {
      let remedyMessage = `No executable exists at "${this.executablePath}"`;

      const isCustomInstall = this.executablePathEnvVar && process.env[this.executablePathEnvVar];
      if (!isCustomInstall) {
        remedyMessage = `Please re-install the browser engine:
-------------------------------------------------
-------------- NPM INSTALL ----------------------
-------------------------------------------------

 npm install @ulixee/${this.engineOption.id}

-------------------------------------------------
`;
      }
      throw new Error(`Failed to launch ${this.name} ${this.fullVersion}:

${remedyMessage}`);
    }
    // exists, validate that host requirements exist
    await this.engineFetcher.validateHostRequirements();
  }

  private loadEngineFetcher(option: IBrowserEngineOption): ChromeApp {
    if (option.name !== 'chrome') {
      throw new Error(`Invalid browser engine requested ${option.name}`);
    }
    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      let ChromeAtMajorVersion = require(`@ulixee/${option.id}`);
      if (ChromeAtMajorVersion.default) {
        ChromeAtMajorVersion = ChromeAtMajorVersion.default;
      }

      return new ChromeAtMajorVersion();
    } catch (err) {
      /* no op */
    }

    return new ChromeApp(option.fullVersion);
  }
}
