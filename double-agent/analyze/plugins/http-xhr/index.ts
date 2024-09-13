import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttpXhrHeadersProfile from '@double-agent/collect-http-basic-headers/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class HttpXhrHeaders extends Plugin {
  initialize(profiles: IHttpXhrHeadersProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'XHR',
      layerName: 'Xhr Headers',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('XHR', profile.userAgentId, checkGenerator.checks);
  }
}
