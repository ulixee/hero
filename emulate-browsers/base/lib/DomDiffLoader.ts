import Fs from 'fs';
import getLocalOperatingSystemMeta from './getLocalOperatingSystemMeta';
import { convertVersionsToTree, getClosestNumberMatch } from './VersionUtils';

const localOsMeta = getLocalOperatingSystemMeta();

export default class DomDiffLoader {
  private readonly dataDir: string;
  private dataMap: {} = {};

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  public get(operatingSystemId: string) {
    if (!this.dataMap[operatingSystemId]) {
      const dir = `${this.dataDir}/${operatingSystemId}`;
      const filename = extractFilename(Fs.readdirSync(dir));
      const data = JSON.parse(Fs.readFileSync(`${dir}/${filename}`, 'utf8'));
      this.dataMap[operatingSystemId] = data;
    }
    return this.dataMap[operatingSystemId];
  }
}

function extractFilename(filenames: string[]) {
  const localOsName = localOsMeta.name;
  const localOsVersion = localOsMeta.version;
  const filenameMap = {};
  for (const filename of filenames) {
    const matches = filename.match(/^dom-diffs-when-using-([a-z-]+)(-([0-9-]+))?.json$/);
    if (!matches) continue;
    const [osName, _, osVersion] = matches.slice(1);
    filenameMap[osName] = filenameMap[osName] || {};
    filenameMap[osName][osVersion || 'ALL'] = filename;
  }

  if (!filenameMap[localOsName]) {
    throw new Error(`Your OS (${localOsName}) is not supported by this emulator.`);
  }

  const versionMatch = findClosestVersionMatch(
    localOsVersion,
    Object.keys(filenameMap[localOsName]),
  );

  if (!versionMatch) {
    throw new Error(`Emulator could not find a version match for ${localOsName} ${localOsVersion}`);
  }

  return filenameMap[localOsName][versionMatch];
}

function findClosestVersionMatch(versionToMatch: string, versions: string[]) {
  if (versions.length === 1 && versions[0] === 'ALL') return 'ALL';

  // there is no guarantee we have an exact match, so let's get the closest
  const versionTree = convertVersionsToTree(versions);
  const [major, minor] = versionToMatch.split('-');

  const majors = Object.keys(versionTree).map(x => Number(x));
  const majorMatch = getClosestNumberMatch(Number(major), majors);
  let versionMatch = `${majorMatch}`;

  if (minor) {
    const minors = Object.keys(versionTree[majorMatch]).map(x => Number(x));
    const minorMatch = getClosestNumberMatch(Number(minor), minors);
    versionMatch += `-${minorMatch}`;
  }
  return versions.includes(versionMatch) ? versionMatch : null;
}
