import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttpBasicCookiesProfile from '@double-agent/collect-http-basic-cookies/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class HttpCookies extends Plugin {
  initialize(profiles: IHttpBasicCookiesProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'BAC',
      layerName: 'Basic Cookies',
      // description: 'Compares header order, capitalization and default values to normal (recorded) user agent values',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('BAC', profile.userAgentId, checkGenerator.checks);
  }
}
