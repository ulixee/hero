import extractUserAgentMeta from './extractUserAgentMeta';
import IOperatingSystem from '../interfaces/IOperatingSystem';
import IOperatingSystemVersion from '../interfaces/IOperatingSystemVersion';
import { IRealUserAgentsData } from '../data';

const macOsNameToVersionMap: IRealUserAgentsData['macOsNameToVersionMap'] = require('../data/os-mappings/macOsNameToVersionMap.json');
const macOsVersionAliasMap: IRealUserAgentsData['macOsVersionAliasMap'] = require('../data/os-mappings/macOsVersionAliasMap.json');
const winOsNameToVersionMap: IRealUserAgentsData['winOsNameToVersionMap'] = require('../data/os-mappings/winOsNameToVersionMap.json');

export function createOsName(name: string): string {
  if (name.startsWith('Win')) return 'Windows';
  if (name.includes('OS X')) return 'Mac OS';
  return name;
}

export function getOsNameFromId(osId: string): string {
  if (osId.startsWith('win')) return 'Windows';
  if (osId.startsWith('mac')) return 'Mac OS';
  return osId;
}

export function getOsVersionFromOsId(osId: string): IOperatingSystemVersion {
  const [major, minor] = osId.replace('windows-', '').replace('mac-os-', '').split('-');
  const rawVersion = [major, minor].filter(Boolean).join('.');

  if (osId.startsWith('win')) {
    for (const [name, version] of Object.entries(winOsNameToVersionMap)) {
      if (version === rawVersion) return { name, major, minor };
    }
  } else if (osId.startsWith('mac')) {
    for (const [name, version] of Object.entries(macOsNameToVersionMap)) {
      if (version === rawVersion) return { name, major, minor };
    }
  }
  return { major, minor };
}

export function createOsId(os: Pick<IOperatingSystem, 'name' | 'version'>): string {
  const name = os.name.toLowerCase().replace(/\s/g, '-').replace('os-x', 'os');
  const minorVersion =
    os.name.startsWith('Win') && os.version.minor === '0' ? null : os.version.minor;
  if (['other', 'linux'].includes(name)) {
    return name;
  }

  let id = `${name}-${os.version.major}`;
  if (minorVersion) id += `-${os.version.minor}`;

  return id;
}

export function createOsIdFromUserAgentString(userAgentString: string): string {
  const { osName, osVersion } = extractUserAgentMeta(userAgentString);
  const name = osName;
  const version = createOsVersion(name, osVersion.major, osVersion.minor);
  return createOsId({ name, version });
}

export function createOsVersion(
  osName: string,
  majorVersionOrVersionString: string,
  minorVersion: string,
): IOperatingSystemVersion {
  let namedVersion;
  let majorVersion = majorVersionOrVersionString;
  if (majorVersion.match(/^([a-z\s]+)/i)) {
    // majorVersion is name instead of number
    namedVersion = majorVersion;
    if (osName.startsWith('Mac') || osName.startsWith('OS X')) {
      const versionString = macOsNameToVersionMap[majorVersion];
      if (versionString) {
        [majorVersion, minorVersion] = versionString.split('.');
      } else {
        const embeddedVersion = majorVersion.match(/(\d+[.\d+]?)/);
        if (embeddedVersion) {
          const converted = convertMacOsVersionString(embeddedVersion[1]);
          [majorVersion, minorVersion] = converted.split('.');
          namedVersion = macOsVersionToNameMap[versionString];
        }
      }
    } else if (osName.startsWith('Win') && winOsNameToVersionMap[majorVersion]) {
      [majorVersion, minorVersion] = winOsNameToVersionMap[majorVersion].split('.');
    }
  } else {
    if (majorVersion.includes('.')) {
      [majorVersion, minorVersion] = majorVersion.split('.');
    }
    // majorVersion is number so let's cleanup
    let versionString = `${majorVersion}.${minorVersion}`;
    if (osName.startsWith('Mac')) {
      versionString = convertMacOsVersionString(versionString);
      [majorVersion, minorVersion] = versionString.split('.');
      namedVersion = macOsVersionToNameMap[versionString];
    } else if (osName.startsWith('Win')) {
      namedVersion = winOsVersionToNameMap[versionString];
    }
  }

  return {
    major: majorVersion,
    minor: minorVersion,
    name: namedVersion,
  };
}

export function convertMacOsVersionString(versionString: string): string {
  let newVersionString = macOsVersionAliasMap[versionString];
  if (!newVersionString) {
    const [majorVersion] = versionString.split('.');
    newVersionString = macOsVersionAliasMap[`${majorVersion}.*`];
  }
  return newVersionString || versionString;
}

const macOsVersionToNameMap = Object.entries(macOsNameToVersionMap).reduce((obj, [a, b]) => {
  return Object.assign(obj, { [b]: a });
}, {});

const winOsVersionToNameMap = Object.entries(winOsNameToVersionMap).reduce((obj, [a, b]) => {
  return Object.assign(obj, { [b]: a });
}, {});
