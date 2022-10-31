import { DiffGradient } from '@double-agent/analyze/lib/scorers';
import { PositiveMatcher } from '@double-agent/analyze/lib/matchers';
import Plugin from '@double-agent/analyze/lib/Plugin';
import ICodecProfile from '@double-agent/collect-browser-codecs/interfaces/IProfile';
import CheckGenerator from './lib/CheckGenerator';

export default class BrowserCodecs extends Plugin {
  initialize(profiledProfiles: ICodecProfile[]) {
    const videoChecks: any[] = [];
    const audioChecks: any[] = [];
    for (const profile of profiledProfiles) {
      const checkGenerator = new CheckGenerator(profile);
      videoChecks.push(...checkGenerator.videoChecks);
      audioChecks.push(...checkGenerator.audioChecks);
    }

    this.initializeProbes({
      layerKey: 'VCD',
      layerName: 'Video Codecs',
      // description: 'Checks that the browser agent supports the ${title} codecs found in a default installation`',
      checks: videoChecks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });

    this.initializeProbes({
      layerKey: 'ACD',
      layerName: 'Audio Codecs',
      // description: 'Compares mime types and clock rates.',
      checks: audioChecks,
      matcher: PositiveMatcher,
      scorer: DiffGradient,
    });
  }

  override runIndividual(profile: any) {
    const checkGenerator = new CheckGenerator(profile);
    return [
      ...this.runProbes('VCD', profile.userAgentId, checkGenerator.videoChecks),
      ...this.runProbes('ACD', profile.userAgentId, checkGenerator.audioChecks),
    ];
  }
}
