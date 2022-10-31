import IBrowserEngine from '@unblocked-web/specifications/agent/browser/IBrowserEngine';
import ChromeApp from '@ulixee/chrome-app';
import { existsAsync } from '@ulixee/chrome-app/lib/dirUtils';
import env from '../env';

export default class ChromeEngine implements IBrowserEngine {
  public static defaultPackageName = `@ulixee/${env.defaultChromeId}`;

  public name = 'chrome';
  public fullVersion: string;
  public executablePath: string;
  public executablePathEnvVar: string;
  public readonly launchArguments: string[] = [];
  public isInstalled: boolean;
  public userDataDir?: string;
  public doesBrowserAnimateScrolling = false;
  public isHeaded?: boolean;

  constructor(readonly source: ChromeApp) {
    this.doesBrowserAnimateScrolling = false;
    this.isInstalled = source.isInstalled;
    this.fullVersion = source.fullVersion;
    this.executablePath = source.executablePath;
    this.executablePathEnvVar = source.executablePathEnvVar;
    if (source.launchArgs) this.launchArguments = [...source.launchArgs];
  }

  async verifyLaunchable(): Promise<any> {
    if (!(await existsAsync(this.executablePath))) {
      let remedyMessage = `No executable exists at "${this.executablePath}"`;

      const isCustomInstall = this.executablePathEnvVar && process.env[this.executablePathEnvVar];
      if (!isCustomInstall) {
        remedyMessage = `Please re-install the browser engine:
-------------------------------------------------
-------------- NPM INSTALL ----------------------
-------------------------------------------------

 npm install @ulixee/${this.fullVersion.split('.').slice(0, 2).join('-')}

-------------------------------------------------
`;
      }
      throw new Error(`Failed to launch ${this.name} ${this.fullVersion}:

${remedyMessage}`);
    }
    // exists, validate that host requirements exist
    await this.source.validateHostRequirements();
  }

  static fromPackageName(npmPackage: string): ChromeEngine {
    // eslint-disable-next-line import/no-dynamic-require
    const Chrome = require(npmPackage) as any;
    const engine = new Chrome();
    return new ChromeEngine(engine);
  }

  static default(): ChromeEngine {
    // eslint-disable-next-line import/no-dynamic-require
    const Chrome = require(this.defaultPackageName) as any;
    const engine = new Chrome();
    return new ChromeEngine(engine);
  }

}
