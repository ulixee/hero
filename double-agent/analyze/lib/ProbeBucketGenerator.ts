import ProbeBucket from './ProbeBucket';
import Probe from './Probe';
import Layer from './Layer';
import { BaseMatcher } from './matchers';
import { BaseScorer } from './scorers';
import BaseCheck, { ICheckType } from './checks/BaseCheck';
import extractBrowserGroupings from './extractBrowserGroupings';

export default class ProbeBucketGenerator {
  public readonly layer: Layer;
  public readonly probeBuckets: any[] = [];
  public probeCount = 0;
  public probeBucketCount = 0;

  public bucketedCheckCount = 0;
  public bucketedProbeCount = 0;

  private readonly meta: IProbeBucketMeta;

  constructor(pluginId: string, meta: IProbeBucketMeta) {
    this.meta = meta;

    const layerKey = Layer.extractKeyFromProbeMeta(meta);
    this.layer = Layer.create(layerKey, meta.layerName, pluginId);

    // convert checks array to object by id
    const universalCheckSignatures: Set<string> = new Set();
    const userAgentIdsByCheckSignature: { [path: string]: Set<string> } = {};
    const probesByCheckSignature: { [signature: string]: Probe } = {};
    for (const check of meta.checks) {
      const signature = check.signature;
      probesByCheckSignature[signature] =
        probesByCheckSignature[signature] || Probe.create(check, pluginId);
      if (check.identity.userAgentId) {
        userAgentIdsByCheckSignature[signature] ??= new Set();
        userAgentIdsByCheckSignature[signature].add(check.identity.userAgentId);
      } else if (check.identity.isUniversal) {
        universalCheckSignatures.add(signature);
      } else {
        throw new Error(`Check is missing userAgentId and is not universal: ${check.signature}`);
      }
    }

    // organize initial groups
    const groupsById: {
      [groupId: string]: {
        userAgentIds: string[];
        checkType: ICheckType;
        checkSignatures: string[];
      };
    } = {};
    for (const checkSignature of Object.keys(userAgentIdsByCheckSignature)) {
      const probe = probesByCheckSignature[checkSignature];
      const checkType = probe.check.type;
      const userAgentIds = Array.from(userAgentIdsByCheckSignature[checkSignature]).sort();
      const groupId = `${checkType}:${userAgentIds.join(':')}`;
      groupsById[groupId] = groupsById[groupId] || { userAgentIds, checkType, checkSignatures: [] };
      groupsById[groupId].checkSignatures.push(checkSignature);
    }

    if (universalCheckSignatures.size) {
      const universalCheckSignaturesByCheckType = Array.from(universalCheckSignatures).reduce(
        (byCheckType, checkSignature) => {
          const probe = probesByCheckSignature[checkSignature];
          const checkType = probe.check.type;
          byCheckType[checkType] = byCheckType[checkType] || [];
          byCheckType[checkType].push(checkSignature);
          return byCheckType;
        },
        {},
      );
      for (const checkType of Object.keys(universalCheckSignaturesByCheckType)) {
        const checkSignatures = universalCheckSignaturesByCheckType[checkType];
        if (checkSignatures.length) {
          groupsById[`${checkType}:universal`] = {
            userAgentIds: [],
            checkType: checkType as ICheckType,
            checkSignatures: Array.from(universalCheckSignatures),
          };
        }
      }
    }

    // reorganize groups that aren't cleanly organized by browser group
    for (const groupId of Object.keys(groupsById)) {
      const group = groupsById[groupId];
      const groupingDetails = extractBrowserGroupings(group.userAgentIds);
      const isBucketed = groupingDetails.every(x => x[0].includes('AllProfiled'));
      if (isBucketed || group.userAgentIds.length <= 1) continue;
      for (const userAgentId of group.userAgentIds) {
        const checkType = group.checkType;
        for (const checkSignature of group.checkSignatures) {
          const newGroupId = `${checkType}:${userAgentId}`;
          groupsById[newGroupId] = groupsById[newGroupId] || {
            userAgentIds: [userAgentId],
            checkType,
            checkSignatures: [],
          };
          groupsById[newGroupId].checkSignatures.push(checkSignature);
        }
      }
      delete groupsById[groupId];
    }

    // sort groups
    const sortedGroups = Object.values(groupsById).sort((a, b) => {
      if (a.userAgentIds.length === 1 && b.userAgentIds.length > 1) {
        return 1;
      }
      if (a.userAgentIds.length > 1 && b.userAgentIds.length === 1) {
        return -1;
      }
      return b.checkSignatures.length - a.checkSignatures.length;
    });

    // convert groups into probes
    for (const group of sortedGroups) {
      const groupingDetails = extractBrowserGroupings(group.userAgentIds);
      const probes = group.checkSignatures.map(id => probesByCheckSignature[id]);
      const probeBucket = ProbeBucket.create(
        this.layer,
        probes,
        group.userAgentIds,
        meta.matcher,
        meta.scorer,
      );

      this.probeBuckets.push(probeBucket);
      this.probeBucketCount += 1;
      this.probeCount += group.checkSignatures.length;

      if (groupingDetails.every(x => x[0].includes('AllProfiled'))) {
        this.bucketedCheckCount += group.checkSignatures.length;
        this.bucketedProbeCount += 1;
      }
    }
  }
}

// TYPES //////

type Constructable<T> = new (...args: any[]) => T;

export interface IProbeBucketMeta {
  layerKey?: string;
  layerName: string;
  description?: string;
  matcher: Constructable<BaseMatcher>;
  scorer: Constructable<BaseScorer>;
  checks: BaseCheck[];
}
