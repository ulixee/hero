import * as Fs from 'fs';
import * as Path from 'path';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import getAllPlugins from '@double-agent/analyze/lib/getAllPlugins';
import Plugin from '@double-agent/analyze/lib/Plugin';
import Layer from '@double-agent/analyze/lib/Layer';
import Config from '../index';
import { extractProfilePathsMap, importProfile, IProfilePathsMap } from './ProfileUtils';

export default class ProbesGenerator {
  private profilePathsMap: IProfilePathsMap = {};
  private totalChecks = 0;
  private layers: Layer[] = [];
  private plugins: Plugin[] = [];

  constructor(profilesDir: string, userAgentIdsToUse?: string[]) {
    for (const userAgentId of Fs.readdirSync(profilesDir)) {
      const profileDir = Path.join(profilesDir, userAgentId);
      if (userAgentIdsToUse && !userAgentIdsToUse.includes(userAgentId)) continue;
      if (!Fs.lstatSync(profileDir).isDirectory()) continue;
      extractProfilePathsMap(profileDir, userAgentId, this.profilePathsMap);
    }
  }

  public async clearBuckets(): Promise<void> {
    const probeBucketsDir = Path.join(Config.probesDataDir, 'probe-buckets');
    const probesDir = Path.join(Config.probesDataDir, 'probes');
    await Fs.promises.rm(probeBucketsDir, { recursive: true }).catch(() => null);
    await Fs.promises.rm(probesDir, { recursive: true }).catch(() => null);
  }

  public run(): void {
    this.plugins = getAllPlugins();
  }

  public save(): void {
    const probeBucketsDir = Path.join(Config.probesDataDir, 'probe-buckets');
    const probesDir = Path.join(Config.probesDataDir, 'probes');
    const probeIdsDir = Path.join(Config.probesDataDir, 'probe-ids');
    if (!Fs.existsSync(probeBucketsDir)) Fs.mkdirSync(probeBucketsDir, { recursive: true });
    if (!Fs.existsSync(probesDir)) Fs.mkdirSync(probesDir, { recursive: true });
    if (!Fs.existsSync(probeIdsDir)) Fs.mkdirSync(probeIdsDir, { recursive: true });

    for (const plugin of this.plugins) {
      console.log('---------------------------------------');
      console.log(`GET PROFILES ${plugin.id}`);

      const profiledProfiles = this.getProfiles<IBaseProfile>(plugin.id);
      console.log(`LOADED ${plugin.id}`);
      plugin.initialize(profiledProfiles);

      console.log(`SAVING ${plugin.id}`);

      const probeBucketsData = JSON.stringify(plugin.probeBuckets, null, 2);
      Fs.writeFileSync(`${probeBucketsDir}/${plugin.id}.json`, probeBucketsData);

      const probesData = JSON.stringify(plugin.probes, null, 2);
      Fs.writeFileSync(`${probesDir}/${plugin.id}.json`, probesData);

      const probeIdsData = JSON.stringify(Config.probeIdsMap[plugin.id], null, 2);
      Fs.writeFileSync(`${probeIdsDir}/${plugin.id}.json`, probeIdsData);

      this.layers.push(...plugin.layers);

      for (const layer of plugin.layers) {
        const probeBuckets = plugin.probeBuckets.filter(x => x.layerId === layer.id);
        const checkCount = probeBuckets.map(p => p.probes.length).reduce((a, b) => a + b, 0);
        this.totalChecks += checkCount;
        console.log(
          `${layer.name} (${layer.id} has ${probeBuckets.length} probe buckets (${checkCount} checks)`,
        );
      }
    }

    const layersData = JSON.stringify(this.layers, null, 2);
    Fs.writeFileSync(`${Config.probesDataDir}/layers.json`, layersData);

    console.log('======');
    console.log(`${this.totalChecks} TOTAL CHECKS`);
  }

  private getProfiles<TProfile = any>(pluginId: string): TProfile[] {
    const profiles: TProfile[] = [];
    if (!this.profilePathsMap[pluginId]) return profiles;

    Object.values(this.profilePathsMap[pluginId]).forEach(profilePath => {
      const profile = importProfile<TProfile>(profilePath);
      profiles.push(profile as TProfile);
    });

    return profiles;
  }
}
