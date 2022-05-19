import * as Fs from 'fs';
import * as Path from 'path';
import { getCacheDirectory } from '../lib/dirUtils';
import { safeOverwriteFile } from '../lib/fileUtils';
import { isSemverSatisfied } from '../lib/VersionUtils';

export default class UlixeeServerConfig {
  public static global = new UlixeeServerConfig(Path.join(getCacheDirectory(), 'ulixee'));

  public hostByVersion: IUlixeeServerConfig['hostByVersion'] = {};

  private get configPath(): string {
    return Path.join(this.directoryPath, 'servers.json');
  }

  constructor(readonly directoryPath: string) {
    if (Fs.existsSync(this.configPath)) {
      const data: IUlixeeServerConfig = JSON.parse(Fs.readFileSync(this.configPath, 'utf8'));
      this.hostByVersion = data.hostByVersion ?? {};
    }
  }

  public async setVersionHost(version: string, host: string): Promise<void> {
    if (!host) delete this.hostByVersion[version];
    else {
      let serverModulePath: string;
      try {
        serverModulePath = require.resolve('@ulixee/server');
      } catch (err) {}
      this.hostByVersion[version] = {
        host,
        nodePath: process.execPath,
        serverModulePath,
      };
    }
    await this.save();
  }

  public hasServers(): boolean {
    return Object.keys(this.hostByVersion).length > 0;
  }

  public getVersionHost(version: string): string {
    if (this.hostByVersion[version]) return this.hostByVersion[version].host;
    for (const [hostVersion, info] of Object.entries(this.hostByVersion)) {
      if (isSemverSatisfied(version, hostVersion)) {
        return info.host;
      }
    }
    return null;
  }

  public save(): Promise<void> {
    return safeOverwriteFile(this.configPath, JSON.stringify(this.getData(), null, 2));
  }

  private getData(): IUlixeeServerConfig {
    return {
      hostByVersion: this.hostByVersion,
    };
  }
}

export interface IUlixeeServerConfig {
  hostByVersion: {
    [version: string]: { host: string; nodePath: string; serverModulePath: string };
  };
}
