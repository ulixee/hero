import Hero from '../lib/Hero';
import IHeroCreateOptions from './IHeroCreateOptions';

type IHeroReplayCreateOptions =
  | Pick<
      IHeroCreateOptions,
      | 'replaySessionId'
      | 'connectionToCore'
      | 'input'
      | 'mode'
      | 'showChrome'
      | 'showChromeAlive'
      | 'showChromeInteractions'
    >
  | {
      hero?: Hero;
    };
export default IHeroReplayCreateOptions;
