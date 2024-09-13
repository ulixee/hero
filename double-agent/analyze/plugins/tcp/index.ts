import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import ITcpProfile from '@double-agent/collect/plugins/tcp/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class TcpPlugin extends Plugin {
  initialize(profiles: ITcpProfile[]) {
    const ttlChecks: any[] = [];
    const winChecks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      ttlChecks.push(...checkGenerator.ttlChecks);
      winChecks.push(...checkGenerator.winChecks);
    }

    this.initializeProbes({
      layerKey: 'TTL',
      layerName: 'Time-to-Live',
      // description: 'Checks that the browser agent supports the ${title} codecs found in a default installation`',
      checks: ttlChecks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });

    this.initializeProbes({
      layerKey: 'WNS',
      layerName: 'Window Size',
      // description: 'Checks that the browser agent supports the ${title} codecs found in a default installation`',
      checks: winChecks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return [
      ...this.runProbes('TTL', profile.userAgentId, checkGenerator.ttlChecks),
      ...this.runProbes('WNS', profile.userAgentId, checkGenerator.winChecks),
    ];
  }
}
