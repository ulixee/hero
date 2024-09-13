import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import IProfile from '@double-agent/collect-http-assets/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class HttpAssetHeaders extends Plugin {
  initialize(profiles: IProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    // TODO: ensure assets are loaded, otherwise probably bot (counts by type?)

    this.initializeProbes({
      layerKey: 'ASH',
      layerName: 'Asset Headers',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('ASH', profile.userAgentId, checkGenerator.checks);
  }
}
