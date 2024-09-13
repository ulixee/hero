import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import axios from 'axios';
import { getDataFilePath } from '../lib/paths';
import IStableChromeVersion from '../interfaces/IStableChromeVersion';

const chromeVersionsPath = getDataFilePath('stableChromeVersions.json');

export default async function updateStableChromeVersions(): Promise<void> {
  const response = await axios.get<IChromeVersions>(
    'https://raw.githubusercontent.com/ulixee/chrome-versions/main/versions.json',
    {
      responseType: 'json',
    },
  );
  console.log(response.data);
  const json = response.data;
  const versionsByMajor: {
    [major: string]: { build: number; byOs: { win: number[]; mac: number[]; linux: number[] } };
  } = {};

  for (const [version, os] of Object.entries(json)) {
    const [major /* zero */, , build, patch] = version.split('.').filter(Boolean).map(Number);
    versionsByMajor[major] ??= { byOs: { mac: [], win: [], linux: [] }, build };
    const byOs = versionsByMajor[major].byOs;
    if (os.mac) {
      byOs.mac.push(patch);
      byOs.mac.sort((a, b) => b - a);
    }
    if (os.linux) {
      byOs.linux.push(patch);
      byOs.linux.sort((a, b) => b - a);
    }
    if (os.win32) {
      byOs.win.push(patch);
      byOs.win.sort((a, b) => b - a);
    }
  }

  const entries = Object.entries(versionsByMajor).sort((a, b) => {
    return Number(b[0]) - Number(a[0]);
  });

  const supportedVersions: IStableChromeVersion[] = [];
  for (const [majorVersion, parts] of entries) {
    supportedVersions.push({
      id: `chrome-${majorVersion}-0`,
      name: 'chrome',
      majorVersion: Number(majorVersion),
      buildVersion: parts.build,
      stablePatchesByOs: parts.byOs,
    });
  }

  await Fs.promises.writeFile(chromeVersionsPath, JSON.stringify(supportedVersions, null, 2));
  console.log('---------------------');
  console.log(`FINISHED exporting supported browsers`);
}

interface IChromeVersions {
  [versionNumber: string]: {
    mac_arm64: string;
    mac: string;
    linux: string;
    linux_rpm: string;
    win32: string;
    win64: string;
  };
}
