import { readFileSync } from 'fs';
import * as Path from 'path';
import { dataDir } from './paths';

let data: {
  windowsUniversalApiMap: { [platform: string]: string };
  osReleaseDates: { [osVersion: string]: string };
};
export default function findUaClientHintsPlatformVersion(osId: string): string[] {
  if (!data) {
    data = {
      windowsUniversalApiMap: JSON.parse(
        readFileSync(Path.join(dataDir, 'manual/windowsUniversalApiMap.json'), 'utf8'),
      ),
      osReleaseDates: JSON.parse(
        readFileSync(Path.join(dataDir, 'manual/osReleaseDates.json'), 'utf8'),
      ),
    };
  }
  const uaClientHintsPlatformVersions: string[] = [];
  if (osId.startsWith('windows')) {
    let version = osId.replace('windows-', '');
    if (!version.includes('-')) version += '-0'
    for (const [release, platform] of Object.entries(data.windowsUniversalApiMap)) {
      if (!release.startsWith(version)) continue;
      uaClientHintsPlatformVersions.push(platform);
    }
  } else if (osId.startsWith('mac')) {
    for (const release of Object.keys(data.osReleaseDates)) {
      if (!release.startsWith(`${osId}-`)) continue;
      const releaseVersion = release.replace(`mac-os-`, '');
      const parts = releaseVersion.split('-');
      uaClientHintsPlatformVersions.push(`${parts[0]}.${parts[1] ?? 0}.${parts[2] ?? 0}`);
    }
  }
  return uaClientHintsPlatformVersions;
}
