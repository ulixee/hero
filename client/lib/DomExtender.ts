import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import SuperElement from 'awaited-dom/impl/super-klasses/SuperElement';
import SuperNode from 'awaited-dom/impl/super-klasses/SuperNode';
import SuperHTMLElement from 'awaited-dom/impl/super-klasses/SuperHTMLElement';
import Element from 'awaited-dom/impl/official-klasses/Element';
import Node from 'awaited-dom/impl/official-klasses/Node';
import HTMLElement from 'awaited-dom/impl/official-klasses/HTMLElement';
import { ITypeInteraction } from '../interfaces/IInteractions';
import Interactor from './Interactor';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import { createInstanceWithNodePointer } from './SetupAwaitedHandler';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import INodePointer from 'awaited-dom/base/INodePointer';
import { IElementInteractVerification } from '@ulixee/hero-interfaces/IInteractions';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

interface IBaseExtend {
  $click: (verification?: IElementInteractVerification) => Promise<void>;
  $type: (...typeInteractions: ITypeInteraction[]) => Promise<void>;
  $waitForVisible: (
    options?: { timeoutMs?: number } & Pick<IWaitForElementOptions, 'ignoreVisibilityAttributes'>,
  ) => Promise<ISuperElement>;
  $waitForHidden: (
    options?: { timeoutMs?: number } & Pick<IWaitForElementOptions, 'ignoreVisibilityAttributes'>,
  ) => Promise<ISuperElement>;
  $getComputedVisibility: () => Promise<INodeVisibility>;
}

declare module 'awaited-dom/base/interfaces/super' {
  interface ISuperElement extends IBaseExtend {}
  interface ISuperNode extends IBaseExtend {}
  interface ISuperHTMLElement extends IBaseExtend {}
}

declare module 'awaited-dom/base/interfaces/official' {
  interface IElement extends IBaseExtend {}
  interface INode extends IBaseExtend {}
  interface IHTMLElement extends IBaseExtend {}
}

const ExtensionFns = {
  async $click(verification: IElementInteractVerification = 'elementAtPath'): Promise<void> {
    const coreFrame = await getCoreFrame(this);
    await Interactor.run(coreFrame, [{ click: { element: this, verification } }]);
  },
  async $type(...typeInteractions: ITypeInteraction[]): Promise<void> {
    const coreFrame = await getCoreFrame(this);
    await this.$click();
    await Interactor.run(
      coreFrame,
      typeInteractions.map(t => ({ type: t })),
    );
  },
  async $waitForVisible(
    options?: { timeoutMs?: number } & Pick<IWaitForElementOptions, 'ignoreVisibilityAttributes'>,
  ): Promise<ISuperElement> {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;

    const nodePointer = await coreFrame.waitForElement(awaitedPath.toJSON(), {
      waitForVisible: true,
      ...options,
    });
    if (!nodePointer) return null;
    return createInstanceWithNodePointer(
      awaitedPathState,
      awaitedPath,
      awaitedOptions,
      nodePointer,
    );
  },
  async $waitForHidden(
    options?: { timeoutMs?: number } & Pick<IWaitForElementOptions, 'ignoreVisibilityAttributes'>,
  ): Promise<ISuperElement> {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;

    const nodePointer = await coreFrame.waitForElement(awaitedPath.toJSON(), {
      waitForHidden: true,
      ...options,
    });
    if (!nodePointer) return null;
    return createInstanceWithNodePointer(
      awaitedPathState,
      awaitedPath,
      awaitedOptions,
      nodePointer,
    );
  },
  async $getComputedVisibility(): Promise<INodeVisibility> {
    const coreFrame = await getCoreFrame(this);
    return await coreFrame.getComputedVisibility(this);
  },
};

for (const Item of [SuperElement, SuperNode, SuperHTMLElement, Element, Node, HTMLElement]) {
  for (const [key, value] of Object.entries(ExtensionFns)) {
    void Object.defineProperty(Item.prototype, key, {
      enumerable: false,
      configurable: false,
      writable: false,
      value,
    });
  }
}

async function getCoreFrame(element: ISuperElement): Promise<CoreFrameEnvironment> {
  const { awaitedOptions } = awaitedPathState.getState(element);
  return await awaitedOptions.coreFrame;
}
