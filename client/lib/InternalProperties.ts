import StateMachine from 'awaited-dom/base/StateMachine';
import Hero from './Hero';
import CoreTab from './CoreTab';
import Tab from './Tab';
import IClientPlugin from '@ulixee/hero-interfaces/IClientPlugin';
import FrameEnvironment from './FrameEnvironment';
import FrozenFrameEnvironment from './FrozenFrameEnvironment';
import CoreFrameEnvironment from './CoreFrameEnvironment';

const { getState, setState } = StateMachine();

interface ITabState {
  coreTabPromise: Promise<CoreTab>;
}

interface IFrameState {
  coreFramePromise: Promise<CoreFrameEnvironment>;
}

interface IHeroState {
  clientPlugins: IClientPlugin[];
}

export default class InternalProperties {
  public static set(object: Hero, state: IHeroState): void;
  public static set(object: Tab, state: ITabState): void;
  public static set(object: FrameEnvironment, state: IFrameState): void;
  public static set(object: FrozenFrameEnvironment, state: IFrameState): void;
  public static set(
    object: Hero | Tab | FrameEnvironment | FrozenFrameEnvironment,
    state: IHeroState | ITabState | IFrameState,
  ): void {
    setState(object, state);
  }

  public static get(object: Hero): IHeroState;
  public static get(object: Tab): ITabState;
  public static get(object: Hero): IHeroState;
  public static get(object: FrameEnvironment): IFrameState;
  public static get(object: FrozenFrameEnvironment): IFrameState;
  public static get(
    object: Hero | Tab | FrameEnvironment | FrozenFrameEnvironment,
  ): IHeroState | ITabState | IFrameState {
    return getState(object) as any;
  }
}
