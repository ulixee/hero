import { IDataUserAgentOption, IDataUserAgentOptions } from '../interfaces/IBrowserData';
import DataLoader from './DataLoader';
import { UAParser } from 'ua-parser-js';
import { pickRandom } from '@ulixee/commons/lib/utils';
import IUserAgentOption, { IVersion } from '@unblocked/emulator-spec/browser/IUserAgentOption';
import UserAgentSelector from './UserAgentSelector';
import { createBrowserId, createOsId } from './BrowserData';
import BrowserEngineOptions from './BrowserEngineOptions';

export default class UserAgentOptions {
  private static parsedCached: { [uaString: string]: IUserAgentOption } = {};
  private installedUserAgentOptions: IDataUserAgentOptions;
  private readonly defaultBrowserUserAgentOptions: IDataUserAgentOptions;

  public get all(): IDataUserAgentOptions {
    return this.dataLoader.userAgentOptions;
  }

  public get installedOptions(): IDataUserAgentOptions {
    if (!this.installedUserAgentOptions) {
      const enginesByNameVersion = new Set<string>();
      for (const engine of this.browserEngineOptions.installedOptions) {
        enginesByNameVersion.add(engine.id);
      }

      this.installedUserAgentOptions = [];
      for (const userAgent of this.all) {
        const id = `${userAgent.browserName}-${userAgent.browserVersion.major}-${userAgent.browserVersion.minor}`;
        if (enginesByNameVersion.has(id)) {
          this.installedUserAgentOptions.push(userAgent);
        }
      }
    }
    return this.installedUserAgentOptions;
  }

  constructor(
    protected dataLoader: DataLoader,
    protected browserEngineOptions: BrowserEngineOptions,
  ) {
    const defaultBrowserEngine = browserEngineOptions.default;
    this.defaultBrowserUserAgentOptions = this.installedOptions.filter(
      x =>
        x.browserName === defaultBrowserEngine.name &&
        x.browserVersion.major === defaultBrowserEngine.version.major,
    );
  }

  public getDefaultAgentOption(): IUserAgentOption {
    return UserAgentOptions.random(this.defaultBrowserUserAgentOptions);
  }

  public findClosestInstalledToUserAgentString(userAgentString: string): IUserAgentOption {
    // otherwise parse the agent
    let userAgent = UserAgentOptions.parse(userAgentString);
    const browserId = createBrowserId(userAgent);
    const osId = createOsId(userAgent);
    if (
      !this.dataLoader.isInstalledBrowserAndOs(browserId, osId) ||
      !this.browserEngineOptions.installedOptions.some(x => x.id === browserId)
    ) {
      userAgent = this.findClosestInstalled(userAgent);
      userAgent.string = userAgentString;
    }

    if (!UserAgentOptions.canTrustOsVersionForAgentString(userAgent)) {
      UserAgentOptions.replaceOperatingSystem(userAgent, this.installedOptions);
    }
    return userAgent;
  }

  public findClosestInstalled(userAgent: IUserAgentOption): IUserAgentOption {
    let filteredOptions = this.installedOptions.filter(
      x =>
        x.browserName === userAgent.browserName &&
        x.browserVersion.major === userAgent.browserVersion.major,
    );
    // if none on this version, go to default
    if (!filteredOptions.length) filteredOptions = this.defaultBrowserUserAgentOptions;

    const withOs = filteredOptions.filter(
      x => x.operatingSystemName === userAgent.operatingSystemName,
    );

    if (withOs.length) filteredOptions = withOs;

    const withOsVersion = filteredOptions.filter(x =>
      isLeftVersionGreater(x.operatingSystemVersion, userAgent.operatingSystemVersion, true),
    );

    if (withOsVersion.length) filteredOptions = withOsVersion;

    return UserAgentOptions.random(filteredOptions);
  }

  public findWithSelector(selectors: UserAgentSelector): IUserAgentOption {
    const filteredOptions = this.installedOptions.filter(selectors.isMatch);

    if (!filteredOptions.length) return null;

    return UserAgentOptions.random(filteredOptions);
  }

  private static parse(userAgentString: string): IUserAgentOption {
    if (this.parsedCached[userAgentString]) return this.parsedCached[userAgentString];
    const uaParser = new UAParser(userAgentString);
    const uaBrowser = uaParser.getBrowser();
    const uaOs = uaParser.getOS();

    const [browserVersionMajor, browserVersionMinor, browserVersionPatch, browserVersionBuild] =
      uaBrowser.version.split('.');
    const browserName = (uaBrowser.name || '').toLowerCase().replace(' ', '-');

    // eslint-disable-next-line prefer-const
    let [osVersionMajor, osVersionMinor, osVersionPatch] = uaOs.version.split('.');
    const operatingSystemName = (uaOs.name || '').toLowerCase().replace(' ', '-');
    if (operatingSystemName === 'mac-os' && osVersionMajor === '10' && osVersionMinor === '16') {
      osVersionMajor = '11';
      osVersionMinor = undefined;
    }

    this.parsedCached[userAgentString] = {
      browserName,
      browserVersion: {
        major: browserVersionMajor ?? '1',
        minor: browserVersionMinor ?? '0',
        patch: browserVersionPatch,
        build: browserVersionBuild,
      },
      operatingSystemName,
      operatingSystemPlatform:
        operatingSystemName === 'mac-os'
          ? 'MacIntel'
          : operatingSystemName === 'windows'
          ? 'Win32'
          : 'Linux',
      operatingSystemVersion: {
        major: osVersionMajor,
        minor: osVersionMinor,
        patch: osVersionPatch,
      },
      string: userAgentString,
    };
    return this.parsedCached[userAgentString];
  }

  private static random(dataUserAgentOptions: IDataUserAgentOptions): IUserAgentOption {
    const dataUserAgentOption = pickRandom<IDataUserAgentOption>(dataUserAgentOptions);
    return this.convertToUserAgentOption(dataUserAgentOption);
  }

  private static convertToUserAgentOption(
    dataUserAgentOption: IDataUserAgentOption,
  ): IUserAgentOption {
    const userAgent = {
      ...dataUserAgentOption,
      browserVersion: { ...dataUserAgentOption.browserVersion },
      operatingSystemVersion: { ...dataUserAgentOption.operatingSystemVersion },
      strings: undefined,
      string: pickRandom(dataUserAgentOption.strings),
    } as IUserAgentOption;

    const parsed = this.parse(userAgent.string);
    userAgent.browserVersion.build ??= parsed.browserVersion.build;

    if (this.canTrustOsVersionForAgentString(parsed)) {
      userAgent.operatingSystemVersion = parsed.operatingSystemVersion;
    } else {
      this.chooseOsPatchValue(userAgent);
    }
    return userAgent;
  }

  private static canTrustOsVersionForAgentString(agentOption: IUserAgentOption): boolean {
    // Chrome 90+ started pegging the OS versions to 10.15.7
    if (
      agentOption.operatingSystemName === 'mac-os' &&
      Number(agentOption.browserVersion.major) > 90 &&
      agentOption.operatingSystemVersion.major === '10' &&
      agentOption.operatingSystemVersion.minor === '15' &&
      agentOption.operatingSystemVersion.patch === '7'
    ) {
      return false;
    }

    // windows 11 never shows up in the os version (shows as 10)
    if (
      agentOption.operatingSystemName === 'windows' &&
      agentOption.operatingSystemVersion.major === '10'
    ) {
      return false;
    }
    return true;
  }

  private static replaceOperatingSystem(
    userAgent: IUserAgentOption,
    dataUserAgentOptions: IDataUserAgentOptions,
  ): void {
    const realOperatingSystem = dataUserAgentOptions.find(
      x =>
        x.browserName === userAgent.browserName &&
        x.browserVersion.major === userAgent.browserVersion.major &&
        x.browserVersion.minor === userAgent.browserVersion.minor &&
        x.operatingSystemName === userAgent.operatingSystemName &&
        isLeftVersionGreater(x.operatingSystemVersion, userAgent.operatingSystemVersion),
    );
    if (realOperatingSystem) {
      userAgent.operatingSystemVersion = { ...realOperatingSystem.operatingSystemVersion };
      this.chooseOsPatchValue(userAgent);
    }
  }

  // TODO: we need a way to pick good randomized values for these. We're tacking onto the "true" os value.
  //    We could collect valid values as part of data generation...
  private static chooseOsPatchValue(userAgent: IUserAgentOption): void {
    userAgent.operatingSystemVersion.patch = '1';
  }
}

function isLeftVersionGreater(a: IVersion, b: IVersion, allowEqual = false): boolean {
  for (const key of ['major', 'minor', 'patch', 'build']) {
    const aValue = Number(a[key] ?? 0);
    const bValue = Number(b[key] ?? 0);
    if (aValue > bValue) return true;
    if (allowEqual && aValue === bValue) return true;
    if (aValue < bValue) return false;
  }

  return false;
}
