import Plugin from '@double-agent/analyze/lib/Plugin';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import IProfile from '@double-agent/collect-browser-dom-environment/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class BrowserDom extends Plugin {
  initialize(profiles: IProfile[]) {
    const checks: any[] = [];
    for (const profile of profiles) {
      const checkGenerator = new CheckGenerator(profile);
      checks.push(...checkGenerator.checks);
    }

    this.initializeProbes({
      layerKey: 'DOM',
      layerName: 'Document Object Model',
      checks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return this.runProbes('DOM', profile.userAgentId, checkGenerator.checks);
  }
}
