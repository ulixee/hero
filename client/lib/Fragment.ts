import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import FrozenTab from './FrozenTab';
import { createInstanceWithNodePointer } from './SetupAwaitedHandler';
import { getState as getFrozenFrameState } from './FrozenFrameEnvironment';
import INodePointer from 'awaited-dom/base/INodePointer';
import StateMachine from 'awaited-dom/base/StateMachine';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

export default class Fragment {
  public element: ISuperElement;
  public name: string;

  readonly #nodePointer: INodePointer;
  readonly #frozenTab: FrozenTab;

  constructor(frozenTab: FrozenTab, name: string, nodePointer: INodePointer) {
    this.name = name;
    this.#frozenTab = frozenTab;
    this.#nodePointer = nodePointer;
    this.element = createInstanceWithNodePointer(
      awaitedPathState,
      new AwaitedPath(null),
      getFrozenFrameState(frozenTab.mainFrameEnvironment),
      nodePointer,
    );
  }

  public close(): Promise<void> {
    return this.#frozenTab.close();
  }
}
