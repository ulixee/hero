import Os from 'os';
import { convertVersionsToTree, getClosestNumberMatch } from "./VersionUtils";

export default function getLocalOperatingSystemMeta() {
  const platform = Os.platform();
  const release = Os.release();
  const name = extractOsName(platform);
  const version = extractOsVersion(platform, release);
  return { name, version };
}

function extractOsName(platform: string) {
  return platformToOsName[platform.toLowerCase()];
}

function extractOsVersion(platform: string, release: string) {
  let versionStr = '';

  if (platform === 'darwin') {
    versionStr = extractMacOsVersion(release);
  } else if (platform === 'win32') {
    versionStr = extractWindowsVersion(release);
  } // else if linux then no version

  return versionStr.split('.').slice(0, 2).join('-');
}

function extractWindowsVersion(release: string) {
  // there is no guarantee we have an exact match, so let's get the closest
  const [major, minor] = release.split('.');
  const majors = Object.keys(windowsVersionTree).map(x => Number(x));
  const majorMatch = getClosestNumberMatch(Number(major), majors);
  let versionMatch = `${majorMatch}`;

  const minors = Object.keys(windowsVersionTree[majorMatch]).map(x => Number(x));
  const minorMatch = getClosestNumberMatch(Number(minor), minors);
  versionMatch += `.${minorMatch}`;

  return windowsToWindowsVersionMap[versionMatch];
}

function extractMacOsVersion(release: string) {
  // there is no guarantee we have an exact match, so let's get the closest
  const [major, minor, build] = release.split('.');
  const majors = Object.keys(darwinVersionTree).map(x => Number(x));
  const majorMatch = getClosestNumberMatch(Number(major), majors);
  let versionMatch = `${majorMatch}`;

  const minors = Object.keys(darwinVersionTree[majorMatch]).map(x => Number(x));
  const minorMatch = getClosestNumberMatch(Number(minor), minors);
  versionMatch += `.${minorMatch}`;

  if (build) {
    const builds = darwinVersionTree[majorMatch][minorMatch];
    const buildMatch = getClosestNumberMatch(Number(build), builds);
    versionMatch += `.${buildMatch}`;
  }

  return darwinToMacOsVersionMap[versionMatch];
}

const platformToOsName = {
  darwin: 'mac-os',
  win32: 'windows',
  linux: 'linux',
  aix: 'linux',
  freebsd: 'linux',
  openbsd: 'linux',
  sunos: 'linux',
}

// pulled the following from https://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history
const darwinToMacOsVersionMap = {
  '7.0': '10.3.0',
  '7.9': '10.3.9',
  '8.0': '10.4.0',
  '8.11': '10.4.11',
  '9.0': '10.5.0',
  '9.8': '10.5.8',
  '10.0': '10.6.0',
  '10.8': '10.6.8',
  '11.0.0': '10.7.0',
  '11.4.2': '10.7.5',
  '12.0.0': '10.8.0',
  '12.6.0': '10.8.5',
  '13.0.0': '10.9.0',
  '13.4.0': '10.9.5',
  '14.0.0': '10.10.0',
  '14.5.0': '10.10.5',
  '15.0.0': '10.11.0',
  '15.6.0': '10.11.6',
  '16.0.0': '10.12.0',
  '16.5.0': '10.12.4',
  '16.6.0': '10.12.6',
  '17.5.0': '10.13.4',
  '17.6.0': '10.13.5',
  '17.7.0': '10.13.6',
  '18.2.0': '10.14.1',
  '19.2.0': '10.15.2',
  '19.3.0': '10.15.3',
  '19.5.0': '10.15.5',
};

const darwinVersionTree = convertVersionsToTree(Object.keys(darwinToMacOsVersionMap));

const windowsToWindowsVersionMap = {
  '6.1': '10',
  '6.2': '8',
  '6.3': '8.1',
  '10.0': '10',
}
const windowsVersionTree = convertVersionsToTree(Object.keys(windowsToWindowsVersionMap));

