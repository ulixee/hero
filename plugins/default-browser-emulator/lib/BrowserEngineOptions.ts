import { IVersion } from '@ulixee/hero-interfaces/IUserAgentOption';
import IBrowserEngineOption from '@ulixee/hero-interfaces/IBrowserEngineOption';
import DataLoader from './DataLoader';

type IBrowserEngineOptionAndVersion = IBrowserEngineOption & { version: IVersion };

export default class BrowserEngineOptions {
  public readonly default: IBrowserEngineOptionAndVersion;
  public readonly installedOptions: IBrowserEngineOptionAndVersion[] = [];

  constructor(private dataLoader: DataLoader, defaultBrowserId: string) {
    this.checkForInstalled();
    this.default = this.installedOptions[0];
    if (defaultBrowserId) {
      const id = defaultBrowserId.replace('@ulixee/', '');
      this.default = this.installedOptions.find(x => x.id === id);
      if (!this.default)
        throw new Error(`The Default Browser Engine specified in your environment is not installed\n\n
-------- reinstall the browser in your working directory -------
        yarn add ${defaultBrowserId}
----------------------------------------------------------------
      `);
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
