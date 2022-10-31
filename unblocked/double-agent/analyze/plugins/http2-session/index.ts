import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import IHttp2SessionProfile from '@double-agent/collect-http2-session/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class Http2SessionHeaders extends Plugin {
  initialize(profiles: IHttp2SessionProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'H2S',
      layerName: 'Http2 Session',
      // description: 'Compares session settings and frame order',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('H2S', profile.userAgentId, checkGenerator.checks);
  }
}
