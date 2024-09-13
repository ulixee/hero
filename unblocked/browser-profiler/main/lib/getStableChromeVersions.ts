import Axios from 'axios';

export default async function getStableChromeVersions(
  take: number,
): Promise<IStableChromeVersion[]> {
  const response = await Axios.get<IChromeVersions>(
    'https://raw.githubusercontent.com/ulixee/chrome-versions/main/versions.json',
    {
      responseType: 'json',
    },
  );

  const versionsByMajorPresorted: {
    [major: number]: IStableChromeVersion;
  } = {};
  for (const [version, support] of Object.entries(response.data)) {
    const parts = version.split('.').filter(Boolean).map(Number);
    const major = parts[0];
    versionsByMajorPresorted[major] ??= { id: `chrome-${major}-0`, major, versions: [] };
    versionsByMajorPresorted[major].versions.push({
      fullVersion: version,
      patch: parts[3],
      linux: !!support.linux,
      mac: !!support.mac,
      win: !!support.win32,
    });
    versionsByMajorPresorted[major].versions.sort((a, b) => b.patch - a.patch);
  }

  return Object.entries(versionsByMajorPresorted)
    .sort((a, b) => {
      return Number(b[0]) - Number(a[0]);
    })
    .map(x => x[1])
    .slice(0, take);
}

export interface IChromeVersions {
  [versionNumber: string]: {
    mac_arm64: string;
    mac: string;
    linux: string;
    linux_rpm: string;
    win32: string;
    win64: string;
  };
}

export interface IStableChromeVersion {
  id: string;
  major: number;
  versions: {
    fullVersion: string;
    patch: number;
    linux: boolean;
    mac: boolean;
    win: boolean;
  }[];
}
