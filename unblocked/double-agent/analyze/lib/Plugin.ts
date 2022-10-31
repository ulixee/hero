import * as Path from 'path';
import IBaseProfile from '@double-agent/collect/interfaces/IBaseProfile';
import ProbeBucketGenerator, { IProbeBucketMeta } from './ProbeBucketGenerator';
import ProbeBucket from './ProbeBucket';
import Layer from './Layer';
import BaseCheck, { CheckType, ICheckMeta, ICheckType } from './checks/BaseCheck';
import Probe from './Probe';

export default abstract class Plugin {
  public id: string;
  public dir: string;
  public summary: string;
  public probeBuckets: ProbeBucket[] = [];
  public layers: Layer[] = [];

  constructor(pluginDir: string) {
    this.dir = pluginDir;
    this.id = Path.basename(pluginDir);
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const packageJson = require(`${pluginDir}/package.json`);
    if (packageJson) {
      this.summary = packageJson.description;
    }
  }

  public get probes(): Probe[] {
    const probesById: { [id: string]: Probe } = {};
    this.probeBuckets.forEach((bucket) =>
      bucket.probes.forEach((probe) => (probesById[probe.id] = probe)),
    );
    return Object.values(probesById);
  }

  public abstract initialize(profiles: IBaseProfile[]): void;
  public runIndividual?(profile: IBaseProfile): IResultFlag[];
  public runOverTime?(profile: IBaseProfile, profileCountOverTime: number): IResultFlag[];

  protected initializeProbes(meta: IProbeBucketMeta): void {
    if (meta.layerKey) meta.layerKey = meta.layerKey.toLowerCase();
    const probeBucketGenerator = new ProbeBucketGenerator(this.id, meta);
    this.layers.push(probeBucketGenerator.layer);
    this.probeBuckets.push(...probeBucketGenerator.probeBuckets);
  }

  protected runProbes(
    layerKey: string,
    userAgentId: string,
    checks: BaseCheck[],
    profileCountOverTime?: number,
  ): IResultFlag[] {
    layerKey = layerKey.toLowerCase();
    const flags: IResultFlag[] = [];
    const checkType = profileCountOverTime ? CheckType.OverTime : CheckType.Individual;
    const checksBySignature: { [signature: string]: BaseCheck } = {};
    const checksById: { [id: string]: BaseCheck } = {};
    for (const check of checks) {
      checksById[check.id] = check;
      checksBySignature[check.signature] = check;
    }
    const layer = this.layers.find((x) => x.key === layerKey);
    if (!layer) throw new Error(`${this.id} plugin missing layer key: ${layerKey}`);

    const probeBuckets = this.probeBuckets.filter((x) => {
      return (
        x.layerId === layer.id && (!x.userAgentIds.length || x.userAgentIds.includes(userAgentId))
      );
    });

    for (const probeBucket of probeBuckets) {
      for (const probe of probeBucket.probes) {
        if (probe.checkType !== checkType) continue;
        const toCheck = checksBySignature[probe.check.signature];
        const humanScore = probe.check.generateHumanScore(toCheck, profileCountOverTime);

        if (humanScore < 100) {
          const invalidCheckSignature = checksById[probe.check.id]?.signature ?? '[None Provided]';
          const probeId = probe.id;
          const probeBucketId = probeBucket.id;
          flags.push({
            pluginId: this.id,
            userAgentId,
            humanScore,
            probeId,
            probeBucketId,
            checkId: probe.check.id,
            checkSignature: probe.check.signature,
            invalidCheckSignature,
            checkName: probe.checkName,
            checkType: probe.checkType,
            checkMeta: probe.checkMeta,
            toCheckArgs: toCheck?.args,
          });
        }
      }
    }

    return flags;
  }
}

export interface IResultFlag {
  userAgentId: string;
  humanScore: number;
  probeId: string;
  pluginId: string;
  probeBucketId: string;
  checkId: string;
  checkSignature: string;
  invalidCheckSignature: string;
  checkName: string;
  checkType: ICheckType;
  checkMeta: ICheckMeta;
  toCheckArgs: any[];
}
