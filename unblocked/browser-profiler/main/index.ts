import * as Fs from 'fs';
import * as Path from 'path';
import RealUserAgents, { IUserAgentMeta } from '@ulixee/real-user-agents';
import Plugin from '@double-agent/collect/lib/Plugin';
import { gunzipSync } from 'zlib';
import { profileDataDir } from './paths';

export default class BrowserProfiler {
  public static get dataDir(): string {
    return Path.resolve(profileDataDir);
  }

  public static get profilesDir(): string {
    return Path.join(this.dataDir, 'profiles');
  }

  public static get profiledDoms(): string {
    return Path.join(this.dataDir, 'profiled-doms');
  }

  public static get userAgentIds(): string[] {
    return Fs.readdirSync(this.profilesDir).filter(
      x => !x.startsWith('.') && isDirectory(this.userAgentDir(x)),
    );
  }

  public static userAgentDir(userAgentId: string): string {
    return Path.join(this.profilesDir, userAgentId);
  }

  public static init(): void {
    const baseProfilesDir = this.profilesDir;
    if (!Fs.existsSync(baseProfilesDir)) Fs.mkdirSync(baseProfilesDir, { recursive: true });
  }

  public static loadDataFile<T>(relativePath: string): T {
    const absolutePath = Path.resolve(this.dataDir, relativePath);
    return JSON.parse(Fs.readFileSync(absolutePath, 'utf8'));
  }

  public static extractMetaFromUserAgentId(userAgentId: string): IUserAgentMeta {
    return RealUserAgents.extractMetaFromUserAgentId(userAgentId);
  }

  public static getProfile<TProfile = any>(pluginId: string, userAgentId: string): TProfile {
    const profileDir = `${this.profilesDir}/${userAgentId}`;
    const defaultProfilePath = `${profileDir}/${pluginId}.json`;

    if (Fs.existsSync(defaultProfilePath) || Fs.existsSync(`${defaultProfilePath}.gz`)) {
      const profile = importProfile<TProfile>(defaultProfilePath);
      return profile as TProfile;
    }

    const profilePaths: any = {};
    for (const fileName of Fs.readdirSync(profileDir)) {
      if (
        (!fileName.endsWith('.json') && !fileName.endsWith('.json.gz')) ||
        fileName.startsWith('_')
      )
        continue;
      const profilePath = Path.join(profileDir, fileName);
      const [foundPluginId, filenameSuffix] = fileName
        .replace('.json', '')
        .replace('.gz', '')
        .split('--');
      if (foundPluginId === pluginId && filenameSuffix) {
        profilePaths[filenameSuffix] = profilePath;
      }
    }
    if (Object.keys(profilePaths).length) {
      const profile = importProfile<TProfile>(profilePaths);
      return profile as TProfile;
    }
  }

  public static getProfiles<TProfile = any>(pluginId: string): TProfile[] {
    const profiles: TProfile[] = [];

    this.userAgentIds.forEach(userAgentId => {
      const profile = this.getProfile(pluginId, userAgentId);
      if (profile) profiles.push(profile);
    });

    return profiles;
  }

  public static cleanPluginProfiles(pluginIds: string[]): void {
    for (const userAgentId of this.userAgentIds) {
      const profileDir = this.userAgentDir(userAgentId);
      if (!Fs.existsSync(profileDir)) return;

      for (const fileName of Fs.readdirSync(profileDir)) {
        if (!pluginIds.some(x => fileName.startsWith(x))) continue;

        Fs.unlinkSync(Path.join(profileDir, fileName));
      }
    }
  }

  public static findMissingPlugins(userAgentId: string, plugins: Plugin[]): string[] {
    const userAgentDir = this.userAgentDir(userAgentId);
    // no plugins, needs to run
    if (!Fs.existsSync(userAgentDir)) return plugins.map(x => x.id);

    const profileFiles = Fs.readdirSync(userAgentDir);
    const needsRerun: string[] = [];
    for (const plugin of plugins) {
      const files = profileFiles.filter(x => x.startsWith(plugin.id));
      if (files.length < plugin.outputFiles) {
        needsRerun.push(plugin.id);
      }
    }
    return needsRerun;
  }

  public static isMissingPlugins(
    userAgentId: string,
    plugins: Plugin[],
    rerunPluginIds: string[],
  ): boolean {
    const userAgentDir = this.userAgentDir(userAgentId);
    // no plugins, needs to run
    if (!Fs.existsSync(userAgentDir)) return true;

    const profileFiles = Fs.readdirSync(userAgentDir);

    // if we're re-reunning a specific set, only check that those all exist
    if (rerunPluginIds.length) {
      for (const pluginId of rerunPluginIds) {
        const doesPluginAlreadyExist = profileFiles.some(x => x.startsWith(pluginId));
        if (doesPluginAlreadyExist === false) {
          console.log(
            `FOUND PROFILE ${userAgentId}... rerunning plugins: ${rerunPluginIds.join(', ')}`,
          );
          return true;
        }
      }
      return false;
    }

    const expectedFileCount = plugins.reduce((total, x) => x.outputFiles + total, 0);
    if (profileFiles.length >= expectedFileCount) {
      console.log(`FOUND ${userAgentId}... skipping`);
      return false;
    }

    console.log(`FOUND CORRUPTED ${userAgentId}... RERUNNING`, {
      filesCount: profileFiles.length,
      expectedFileCount,
    });
    return true;
  }
}

// HELPERS

function importProfile<TProfile>(profilePath: IProfilePath): TProfile {
  if (typeof profilePath === 'string') {
    let rawData = Fs.readFileSync(profilePath);
    try {
      if (profilePath.endsWith('.gz')) {
        rawData = gunzipSync(rawData);
      }
      if (!rawData.length) return null;
      return JSON.parse(rawData.toString()) as TProfile;
    } catch (error) {
      console.log(profilePath);
      throw error;
    }
  } else {
    const dataByFilenameSuffix: any = {};
    let profile;
    for (const filenameSuffix of Object.keys(profilePath)) {
      profile = importProfile<TProfile>(profilePath[filenameSuffix]);
      dataByFilenameSuffix[filenameSuffix] = profile.data;
    }
    profile.data = dataByFilenameSuffix;
    return profile as TProfile;
  }
}

type IProfilePath = string | { [filenameSuffix: string]: string };

function isDirectory(path: string): boolean {
  return Fs.lstatSync(path).isDirectory();
}
