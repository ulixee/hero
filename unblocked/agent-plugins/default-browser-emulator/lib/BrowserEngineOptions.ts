import { IVersion } from '@unblocked-web/emulator-spec/emulator/IUserAgentOption';
import IBrowserEngineOption from '@unblocked-web/emulator-spec/browser/IBrowserEngineOption';
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
        if (this.browserIdsNeedingDataFiles.has(id)) {
          throw new Error(`The Default Browser Engine specified in your environment does not have Emulation Data Files installed\n\n
-------- Install the data files in your working directory -------
        
         yarn update-browser-emulator-data ${defaultBrowserId}
        
----------------------------------------------------------------
      `);
        }
        throw new Error(`The Default Browser Engine specified in your environment is not installed\n\n
-------- reinstall the browser in your working directory -------
        
                yarn add @ulixee/${defaultBrowserId}
        
----------------------------------------------------------------
      `);
      }
    }
  }

  private isInstalled(browserId: string): boolean {
    try {
      require.resolve(`@ulixee/${browserId}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  private checkForInstalled(): void {
    for (const engine of this.dataLoader.browserEngineOptions) {
      if (!this.isInstalled(engine.id)) continue;

      if (!this.dataLoader.isInstalledBrowser(`as-${engine.id}`)) {
        this.browserIdsNeedingDataFiles.add(engine.id);
        console.warn(`[@ulixee/hero] You have a Chrome Browser Engine installed without accompanying data files needed to emulate Operating Systems & Headed operation. 
          
You must install data files for "${engine.id}" to support emulating the browser.`);
        continue;
      }
      const [major, minor, patch, build] = engine.fullVersion.split('.');
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
}
