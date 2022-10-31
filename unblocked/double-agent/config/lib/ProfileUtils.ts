import * as Fs from 'fs';
import * as Path from 'path';

export function extractProfilePathsMap(
  profileDir: string,
  userAgentId: string,
  profilePathsMap: IProfilePathsMap = {},
): IProfilePathsMap {
  for (const fileName of Fs.readdirSync(profileDir)) {
    if (!fileName.endsWith('.json') || fileName.startsWith('_')) continue;
    const [pluginId, filenameSuffix] = fileName.replace('.json', '').split('--');
    const profilePath = Path.join(profileDir, fileName);
    profilePathsMap[pluginId] = profilePathsMap[pluginId] || {};
    if (filenameSuffix) {
      profilePathsMap[pluginId][userAgentId] ??= {};
      profilePathsMap[pluginId][userAgentId][filenameSuffix] = profilePath;
    } else {
      profilePathsMap[pluginId][userAgentId] = profilePath;
    }
  }
  return profilePathsMap;
}

export function importProfile<TProfile>(profilePath: IProfilePath): TProfile {
  if (typeof profilePath === 'string') {
    const rawData = Fs.readFileSync(profilePath, 'utf8');
    try {
      return JSON.parse(rawData) as TProfile;
    } catch (error) {
      console.log(profilePath);
      throw error;
    }
  } else {
    const dataByFilenameSuffix: any = {};
    let profile;
    for (const filenameSuffix of Object.keys(profilePath)) {
      const rawData = Fs.readFileSync(profilePath[filenameSuffix], 'utf8');
      try {
        profile = JSON.parse(rawData);
      } catch (error) {
        console.log(profilePath[filenameSuffix]);
        throw error;
      }
      dataByFilenameSuffix[filenameSuffix] = profile.data;
    }
    profile.data = dataByFilenameSuffix;
    return profile as TProfile;
  }
}

export interface IProfilePathsMap {
  [pluginId: string]: {
    [userAgentId: string]: IProfilePath;
  };
}

export type IProfilePath = string | { [filenameSuffix: string]: string };
