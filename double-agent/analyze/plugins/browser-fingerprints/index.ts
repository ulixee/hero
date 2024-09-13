import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import IFingerprintProfile from '@double-agent/collect-browser-fingerprints/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class BrowserFingerprints extends Plugin {
  initialize(profiles: IFingerprintProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'FNG',
      layerName: 'Fingerprints',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: IFingerprintProfile) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('FNG', profile.userAgentId, checkGenerator.checks);
  }

  override runOverTime(profile: IFingerprintProfile, profileCountOverTime: number) {
    if (!profileCountOverTime) {
      throw new Error('profileCountOverTime must be > 0');
    }
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('FNG', profile.userAgentId, checkGenerator.checks, profileCountOverTime);
  }
}
