import * as Fs from 'fs';
import * as Path from 'path';
import { getCacheDirectory } from '../lib/dirUtils';
import { isSemverSatisfied } from '../lib/VersionUtils';
import { isPortInUse } from '../lib/utils';
import { TypedEventEmitter } from '../lib/eventUtils';

export default class UlixeeHostsConfig extends TypedEventEmitter<{ change: void }> {
  public static global = new UlixeeHostsConfig(Path.join(getCacheDirectory(), 'ulixee'));

  public hostByVersion: IUlixeeHostsConfig['hostByVersion'] = {};
  #watchHandle: Fs.FSWatcher;

  private get configPath(): string {
    return Path.join(this.directoryPath, 'hosts');
  }

  constructor(readonly directoryPath: string) {
    super();
    if (!Fs.existsSync(this.configPath)) {
      Fs.mkdirSync(this.configPath, { recursive: true });
    }

    this.#watchHandle = Fs.watch(
      this.configPath,
      { recursive: true, persistent: false },
      this.reload.bind(this, true),
    );
    this.reload();
  }

  public setVersionHost(version: string, host: string): void {
    if (!host) {
      delete this.hostByVersion[version];
    } else {
      let minerModulePath: string;
      try {
        minerModulePath = require.resolve('@ulixee/miner');
      } catch (err) {
        /* no-op */
      }
      this.hostByVersion[version] = {
        host,
        nodePath: process.execPath,
        minerModulePath,
      };
    }
    this.save(version);
  }

  public hasHosts(): boolean {
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

  public async checkLocalVersionHost(version: string, host: string): Promise<string> {
    if (!host?.startsWith('localhost')) return host;

    if (host?.startsWith('localhost')) {
      if (!(await isPortInUse(host.split(':').pop()))) {
        this.setVersionHost(version, null);
        return null;
      }
    }
    return host;
  }

  private reload(checkForChange = false): void {
    const prev = checkForChange ? JSON.stringify(this.hostByVersion) : '';
    this.hostByVersion = {};

    for (const file of Fs.readdirSync(this.configPath)) {
      if (file.endsWith('.json')) {
        const versionPath = Path.join(this.configPath, file);
        const version = file.replace('.json', '');
        this.hostByVersion[version] = JSON.parse(Fs.readFileSync(versionPath, 'utf8'));
      }
    }

    if (checkForChange && prev !== JSON.stringify(this.hostByVersion)) {
      this.emit('change');
    }
  }

  private save(version: string): void {
    const versionPath = Path.join(this.configPath, `${version}.json`);
    const host = this.hostByVersion[version];
    if (!host) {
      try {
        Fs.unlinkSync(versionPath);
      } catch (err) {}
    } else {
      Fs.writeFileSync(versionPath, JSON.stringify(host));
    }
  }
}

export interface IUlixeeHostsConfig {
  hostByVersion: {
    [version: string]: IUlixeeHostConfig;
  };
}

export interface IUlixeeHostConfig {
  host: string;
  nodePath: string;
  minerModulePath: string;
}
