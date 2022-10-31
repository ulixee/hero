import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttpBasicHeadersProfile from '@double-agent/collect-http-basic-headers/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class HttpBasicHeaders extends Plugin {
  initialize(profiles: IHttpBasicHeadersProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'BAH',
      layerName: 'Basic Headers',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('BAH', profile.userAgentId, checkGenerator.checks);
  }
}
