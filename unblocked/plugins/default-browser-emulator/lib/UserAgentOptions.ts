import { UAParser } from 'ua-parser-js';
import { pickRandom } from '@ulixee/commons/lib/utils';
import IUserAgentOption, { IVersion } from '@ulixee/unblocked-specification/plugin/IUserAgentOption';
import RealUserAgents from '@ulixee/real-user-agents';
import UserAgent from '@ulixee/real-user-agents/lib/UserAgent';
import findUaClientHintsPlatformVersion from '@ulixee/real-user-agents/lib/findUaClientHintsPlatformVersion';
import DataLoader from './DataLoader';
import UserAgentSelector from './UserAgentSelector';
import { createBrowserId, createOsId } from './BrowserData';
import BrowserEngineOptions from './BrowserEngineOptions';

export default class UserAgentOptions {
  private static parsedCached: { [uaString: string]: IUserAgentOption } = {};
  private installedUserAgentOptions: UserAgent[];
  private readonly defaultBrowserUserAgentOptions: UserAgent[];

  public get installedOptions(): UserAgent[] {
    if (!this.installedUserAgentOptions) {
      const enginesByNameVersion = new Set<string>();
      for (const engine of this.browserEngineOptions.installedOptions) {
        enginesByNameVersion.add(engine.id);
      }

      this.installedUserAgentOptions = [];
      for (const userAgent of RealUserAgents.all()) {
        if (enginesByNameVersion.has(userAgent.browserId)) {
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
      x => x.browserId === defaultBrowserEngine.id,
    );
  }

  public getDefaultAgentOption(): IUserAgentOption {
    return UserAgentOptions.random(this.defaultBrowserUserAgentOptions);
  }

  public hasDataSupport(userAgentOption: IUserAgentOption): boolean {
    const browserId = createBrowserId(userAgentOption);
    const osId = createOsId(userAgentOption);

    return this.dataLoader.isInstalledBrowserAndOs(browserId, osId);
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
    const id = createBrowserId(userAgent);
    let filteredOptions = this.installedOptions.filter(x => x.browserId === id);
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
    const browserName = cleanName(uaBrowser.name || '');

    // eslint-disable-next-line prefer-const
    let [osVersionMajor, osVersionMinor, osVersionPatch] = uaOs.version.split('.');
    const operatingSystemName = cleanName(uaOs.name || '');
    if (operatingSystemName === 'mac-os' && osVersionMajor === '10' && osVersionMinor === '16') {
      osVersionMajor = '11';
      osVersionMinor = undefined;
    }

    const ua: IUserAgentOption = {
      browserName,
      browserVersion: {
        major: browserVersionMajor ?? '1',
        minor: browserVersionMinor ?? '0',
        patch: browserVersionPatch,
        build: browserVersionBuild,
      },
      operatingSystemName,
      operatingSystemVersion: {
        major: osVersionMajor,
        minor: osVersionMinor,
        patch: osVersionPatch,
      },
      uaClientHintsPlatformVersion: uaOs.version,
      string: userAgentString,
    };
    if (browserName.toLowerCase() === 'chrome' && Number(browserVersionMajor) > 89) {
      const platformVersions = findUaClientHintsPlatformVersion(createOsId(ua));
      if (platformVersions.length) {
        ua.uaClientHintsPlatformVersion = pickRandom(platformVersions);
      }
    }

    this.parsedCached[userAgentString] = ua;
    return this.parsedCached[userAgentString];
  }

  private static random(dataUserAgentOptions: UserAgent[]): IUserAgentOption {
    const dataUserAgentOption = pickRandom(dataUserAgentOptions);
    return this.convertToUserAgentOption(dataUserAgentOption);
  }

  private static convertToUserAgentOption(agent: UserAgent): IUserAgentOption {
    let patch = agent.browserBaseVersion[3];
    const [major, minor, build] = agent.browserBaseVersion.map(String);
    if (agent.stablePatchVersions.length) {
      patch = pickRandom(agent.stablePatchVersions);
    }
    const uaClientHintsPlatformVersion = pickRandom(agent.uaClientHintsPlatformVersions);

    const userAgent = {
      browserName: cleanName(agent.browserName),
      browserVersion: { major, minor, build, patch: String(patch) },
      operatingSystemName: cleanName(agent.operatingSystemName),
      operatingSystemVersion: { ...agent.operatingSystemVersion },
      uaClientHintsPlatformVersion,
      string: UserAgent.parse(agent, patch, uaClientHintsPlatformVersion),
    } as IUserAgentOption;

    const parsed = this.parse(userAgent.string);

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
    dataUserAgentOptions: UserAgent[],
  ): void {
    const browserId = createBrowserId(userAgent);
    const realOperatingSystem = dataUserAgentOptions.find(
      x =>
        x.browserId === browserId &&
        cleanName(x.operatingSystemName) === userAgent.operatingSystemName &&
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

const cleanCache: { [name: string]: string } = {};
function cleanName(name: string): string {
  cleanCache[name] ??= name.toLowerCase().replace(/[^a-z]+/, '-');
  return cleanCache[name];
}
