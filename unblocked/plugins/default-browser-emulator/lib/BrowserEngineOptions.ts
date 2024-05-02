import ChromeApp from '@ulixee/chrome-app';
import IBrowserEngineOption from '@ulixee/unblocked-specification/agent/browser/IBrowserEngineOption';
import { IVersion } from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import DataLoader from './DataLoader';

type IBrowserEngineOptionAndVersion = IBrowserEngineOption & { version: IVersion };

export default class BrowserEngineOptions {
  public readonly default: IBrowserEngineOptionAndVersion;
  public readonly installedOptions: IBrowserEngineOptionAndVersion[] = [];

  private browserIdsNeedingDataFiles = new Set<string>();

  constructor(private dataLoader: DataLoader, defaultBrowserId: string) {
    this.checkForInstalled();
    this.default = this.installedOptions[0];
    if (defaultBrowserId) {
      const id = defaultBrowserId.replace('@ulixee/', '');
      this.default = this.installedOptions.find(x => x.id === id);
      if (!this.default) {
        if (this.browserIdsNeedingDataFiles.has(id) || this.getInstalled(id)) {
          throw new Error(
            `The Default Browser Engine specified in your environment does not have Emulation Data Files installed.:\n\n
            
----------- update to the latest data files using ----------
        
         npx @ulixee/default-browser-emulator update
        
------------------------------------------------------------`,
          );
        }
        throw new Error(`The Default Browser Engine specified in your environment is not installed\n\n
-------- reinstall the browser in your working directory -------
        
                npm install @ulixee/${defaultBrowserId}
        
----------------------------------------------------------------
      `);
      }
    }
  }

  private getInstalled(browserId: string): ChromeApp {
    try {
      // eslint-disable-next-line import/no-dynamic-require
      const ChromeVersion = require(`@ulixee/${browserId}`);
      return new ChromeVersion();
    } catch (e) {
      return null;
    }
  }

  private checkForInstalled(): void {
    for (const engine of this.dataLoader.browserEngineOptions) {
      const ChromeVersion = this.getInstalled(engine.id);
      if (!ChromeVersion) continue;

      if (!this.dataLoader.isInstalledBrowser(`as-${engine.id}`)) {
        this.browserIdsNeedingDataFiles.add(engine.id);
        console.warn(`[@ulixee/hero] You have a Chrome Browser Engine installed without accompanying data files needed to emulate Operating Systems & Headed operation. 
          
You must install data files for "${engine.id}" to support emulating the browser.`);
        continue;
      }

      const [major, minor, patch, build] = ChromeVersion.fullVersion.split('.');
      this.installedOptions.push({
        ...engine,
        version: {
          minor,
          major,
          patch,
          build,
        },
      });
    }

    this.installedOptions.sort((a, b) => {
      return Number(b.version.major) - Number(a.version.major);
    });
  }

  public static latestFullVersion(option: IBrowserEngineOption): string {
    let platform: string = ChromeApp.getOsPlatformName();
    if (platform.startsWith('mac')) platform = 'mac';
    if (platform.startsWith('win')) platform = 'win';
    const latest = option.stablePatchesByOs[platform];
    return `${option.majorVersion}.0.${option.buildVersion}.${latest[0]}`;
  }
}
