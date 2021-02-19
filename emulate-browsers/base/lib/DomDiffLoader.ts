import * as Fs from 'fs';
import getLocalOperatingSystemMeta from './getLocalOperatingSystemMeta';
import { findClosestVersionMatch } from './VersionUtils';

const localOsMeta = getLocalOperatingSystemMeta();

export default class DomDiffLoader {
  private readonly dataDir: string;
  private dataMap: {} = {};

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  public get(operatingSystemId: string) {
    if (!this.dataMap[operatingSystemId]) {
      const dir = `${this.dataDir}/as-${operatingSystemId}`;
      const filename = extractFilename(Fs.readdirSync(dir));
      const data = JSON.parse(Fs.readFileSync(`${dir}/${filename}`, 'utf8'));
      this.dataMap[operatingSystemId] = data;
    }
    return this.dataMap[operatingSystemId];
  }
}

function extractFilename(filenames: string[]) {
  const filenameMap = {};
  for (const filename of filenames) {
    const matches = filename.match(/^dom-diffs-when-runtime-([a-z-]+)(-([0-9-]+))?.json$/);
    if (!matches) continue;

    const [osName, _, osVersion] = matches.slice(1); // eslint-disable-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
    filenameMap[osName] = filenameMap[osName] || {};
    filenameMap[osName][osVersion || 'ALL'] = filename;
  }

  if (!filenameMap[localOsMeta.name]) {
    throw new Error(`Your OS (${localOsMeta.name}) is not supported by this emulator.`);
  }

  const versionMatch = findClosestVersionMatch(
    localOsMeta.version,
    Object.keys(filenameMap[localOsMeta.name]),
  );

  if (!versionMatch) {
    throw new Error(`Emulator could not find a version match for ${localOsMeta.name} ${localOsMeta.version}`);
  }

  return filenameMap[localOsMeta.name][versionMatch];
}

