import { UAParser } from 'ua-parser-js';
import { pickRandom } from '@ulixee/commons/lib/utils';
import IUserAgentOption, { IVersion } from '@ulixee/hero-interfaces/IUserAgentOption';
import { IDataUserAgentOption, IDataUserAgentOptions } from '../../interfaces/IBrowserData';
import { latestChromeBrowserVersion } from '../../index';

const compareVersions = require('compare-versions');

export default function selectUserAgentOption(
  userAgentSelector: string,
  dataUserAgentOptions: IDataUserAgentOptions,
): IUserAgentOption {
  userAgentSelector = userAgentSelector?.trim();
  if (userAgentSelector === 'chrome-latest') userAgentSelector = '';

  if (!userAgentSelector) {
    const filteredOptions = dataUserAgentOptions.filter(
      x =>
        x.browserName === 'chrome' &&
        x.browserVersion.major === latestChromeBrowserVersion.major &&
        x.browserVersion.minor === latestChromeBrowserVersion.minor,
    );
    return pickRandomUserAgentOption(filteredOptions);
  }

  if (userAgentSelector.startsWith('~')) {
    return findUserAgentOption(userAgentSelector, dataUserAgentOptions);
  }

  return createUserAgentOption(userAgentSelector);
}

function pickRandomUserAgentOption(dataUserAgentOptions: IDataUserAgentOptions) {
  const dataUserAgentOption = pickRandom<IDataUserAgentOption>(dataUserAgentOptions);
  return convertToUserAgentOption(dataUserAgentOption);
}

function findUserAgentOption(
  userAgentSelector: string,
  dataUserAgentOptions: IDataUserAgentOptions,
) {
  const selectors = extractUserAgentSelectors(userAgentSelector);

  const filteredOptions = dataUserAgentOptions.filter(userAgentOption => {
    return isSelectorMatch(userAgentOption, selectors);
  });

  if (!filteredOptions.length) {
    throw new Error(`No installed UserAgent Emulators match your criteria (${userAgentSelector})`);
  }

  const dataUserAgentOption = pickRandom<IDataUserAgentOption>(filteredOptions);
  return convertToUserAgentOption(dataUserAgentOption);
}

function convertToUserAgentOption(dataUserAgentOption: IDataUserAgentOption) {
  return {
    ...dataUserAgentOption,
    strings: undefined,
    string: pickRandom(dataUserAgentOption.strings),
  } as IUserAgentOption;
}

function isSelectorMatch(userAgentOption: IDataUserAgentOption, selectors: ISelector[]) {
  if (!selectors.length) return true;

  const browserVersion = convertToSemVer(userAgentOption.browserVersion);
  const operatingSystemVersion = convertToSemVer(userAgentOption.operatingSystemVersion);

  for (const { name, matches } of selectors) {
    let version: string;
    if (name === userAgentOption.browserName) {
      version = browserVersion;
    } else if (name === userAgentOption.operatingSystemName) {
      version = operatingSystemVersion;
    } else {
      return false;
    }
    for (const match of matches) {
      if (match.version === '*.*.*') continue;
      const isValid = compareVersions.compare(version, match.version, match.operator);

      // must match every selector
      if (!isValid) return false;
    }
  }
  return true;
}

interface ISelectorMatch {
  operator: string;
  version: string;
}

interface ISelector {
  name: string;
  matches: ISelectorMatch[];
}

function convertToSemVer(version: IVersion) {
  return [version.major, version.minor, version.patch].filter(x => x).join('.');
}

function extractUserAgentSelectors(userAgentSelector: string): ISelector[] {
  const selectorByName: { [name: string]: ISelector } = {};
  const parts = userAgentSelector
    .substr(1)
    .toLowerCase()
    .split('&')
    .map(x => x.trim());
  for (const part of parts) {
    const matches = part.match(/^([a-z\s-]+)([\s><=]+)?([0-9.x*]+)?/);
    if (!matches?.length) continue;
    const [rawName, rawOperator, rawVersion] = matches.slice(1);
    const name = cleanupName(rawName);
    const operator = cleanupOperator(rawOperator);
    let version = cleanupVersion(rawVersion);
    selectorByName[name] = selectorByName[name] || { name, matches: [] };

    if (operator === '=') {
      const versionParts = version.split('.');
      const missingParts = 3 - versionParts.length;
      for (let i = 0; i < missingParts; i += 1) {
        versionParts.push('*');
      }
      version = versionParts.join('.');
    }
    if (version) selectorByName[name].matches.push({ operator, version });
  }

  return Object.values(selectorByName);
}

function cleanupName(name: string) {
  name = name.trim();
  if (name.startsWith('chrome')) return 'chrome';
  if (name.startsWith('firefox')) return 'firefox';
  if (name.startsWith('safari')) return 'safari';
  if (name.startsWith('mac')) return 'mac-os';
  if (name.startsWith('win')) return 'windows';
  if (name.startsWith('linux')) return 'linux';
  return name.split(' ')[0];
}

function cleanupOperator(operator: string) {
  if (!operator) return '=';
  return operator.replace(/[^<>=]+/g, '');
}

function cleanupVersion(version: string) {
  if (!version) return '*';
  return version.trim().replace(/[^0-9x*]+/g, '.');
}

function createUserAgentOption(userAgentString: string): IUserAgentOption {
  const uaParser = new UAParser(userAgentString);
  const uaBrowser = uaParser.getBrowser();
  const uaOs = uaParser.getOS();

  const [browserVersionMajor, browserVersionMinor, browserVersionPatch] = uaBrowser.version
    .split('.')
    .map(x => Number(x));
  const browserName = (uaBrowser.name || '').toLowerCase().replace(' ', '-');

  let [osVersionMajor, osVersionMinor] = uaOs.version.split('.').map(x => Number(x));
  const operatingSystemName = (uaOs.name || '').toLowerCase().replace(' ', '-');
  if (osVersionMajor === 10 && osVersionMinor === 16) {
    osVersionMajor = 11;
    osVersionMinor = undefined;
  }

  return {
    browserName,
    browserVersion: {
      major: browserVersionMajor ? String(browserVersionMajor) : '1',
      minor: browserVersionMinor ? String(browserVersionMinor) : '0',
      patch: browserVersionPatch ? String(browserVersionPatch) : undefined,
    },
    operatingSystemName,
    operatingSystemPlatform: '',
    operatingSystemVersion: {
      major: osVersionMajor ? String(osVersionMajor) : undefined,
      minor: osVersionMinor ? String(osVersionMinor) : undefined,
    },
    string: userAgentString,
  };
}
