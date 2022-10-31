import * as Os from 'os';
import { convertMacOsVersionString } from './OsUtils';
import { convertVersionsToTree, getClosestNumberMatch } from './VersionUtils';
import * as darwinToMacOsVersionMap from '../data/os-mappings/darwinToMacOsVersionMap.json';
import * as windowsToWindowsVersionMap from '../data/os-mappings/windowsToWindowsVersionMap.json';

export default function getLocalOperatingSystemMeta(
  platform = Os.platform(),
  release = Os.release(),
): { name: string; version: string } {
  const name = extractOsName(platform);
  const version = extractOsVersion(platform, release);
  return { name, version };
}

function extractOsName(platform: string): string {
  return platformToOsName[platform.toLowerCase()];
}

function extractOsVersion(platform: string, release: string): string {
  let versionStr = '';

  if (platform === 'darwin') {
    versionStr = extractMacOsVersion(release);
  } else if (platform === 'win32') {
    versionStr = extractWindowsVersion(release);
  } // else if linux then no version

  return versionStr.split('.').slice(0, 2).join('-');
}

function extractWindowsVersion(release: string): string {
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

function extractMacOsVersion(release: string): string {
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

  const versionString = darwinToMacOsVersionMap[versionMatch];
  return convertMacOsVersionString(versionString);
}

const platformToOsName = {
  darwin: 'mac-os',
  win32: 'windows',
  linux: 'linux',
  aix: 'linux',
  freebsd: 'linux',
  openbsd: 'linux',
  sunos: 'linux',
};

const darwinVersionTree = convertVersionsToTree(Object.keys(darwinToMacOsVersionMap));
const windowsVersionTree = convertVersionsToTree(Object.keys(windowsToWindowsVersionMap));
