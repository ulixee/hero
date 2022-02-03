import StateMachine from 'awaited-dom/base/StateMachine';
import {
  ISuperElement,
  ISuperHTMLCollection,
  ISuperHTMLElement,
  ISuperNode,
  ISuperNodeList,
} from 'awaited-dom/base/interfaces/super';
import {
  IElement,
  IHTMLCollection,
  IHTMLElement,
  INode,
  INodeList,
} from 'awaited-dom/base/interfaces/official';
import SuperElement from 'awaited-dom/impl/super-klasses/SuperElement';
import SuperNode from 'awaited-dom/impl/super-klasses/SuperNode';
import SuperHTMLElement from 'awaited-dom/impl/super-klasses/SuperHTMLElement';
import Element from 'awaited-dom/impl/official-klasses/Element';
import Node from 'awaited-dom/impl/official-klasses/Node';
import NodeList from 'awaited-dom/impl/official-klasses/NodeList';
import HTMLCollection from 'awaited-dom/impl/official-klasses/HTMLCollection';
import HTMLElement from 'awaited-dom/impl/official-klasses/HTMLElement';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import INodePointer from 'awaited-dom/base/INodePointer';
import { IElementInteractVerification } from '@ulixee/hero-interfaces/IInteractions';
import SuperNodeList from 'awaited-dom/impl/super-klasses/SuperNodeList';
import SuperHTMLCollection from 'awaited-dom/impl/super-klasses/SuperHTMLCollection';
import { KeyboardKey } from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import { ITypeInteraction } from '../interfaces/IInteractions';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import Interactor from './Interactor';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

interface IBaseExtendNode {
  $isVisible: Promise<boolean>;
  $exists: Promise<boolean>;
  $isClickable: Promise<boolean>;
  $clearValue(): Promise<void>;
  $click(verification?: IElementInteractVerification): Promise<void>;
  $type(...typeInteractions: ITypeInteraction[]): Promise<void>;
  $waitForExists(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForClickable(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForHidden(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForVisible(options?: { timeoutMs?: number }): Promise<ISuperElement>;
}

interface IBaseExtendNodeList {
  $map<T = any>(iteratorFn: (node: ISuperNode, index: number) => Promise<T>): Promise<T[]>;
  $reduce<T = any>(
    iteratorFn: (initial: T, node: ISuperNode) => Promise<T>,
    initial: T,
  ): Promise<T>;
}

declare module 'awaited-dom/base/interfaces/super' {
  interface ISuperElement extends IBaseExtendNode {}
  interface ISuperNode extends IBaseExtendNode {}
  interface ISuperHTMLElement extends IBaseExtendNode {}
  interface ISuperNodeList extends IBaseExtendNodeList {}
  interface ISuperHTMLCollection extends IBaseExtendNodeList {}
}

declare module 'awaited-dom/base/interfaces/official' {
  interface IElement extends IBaseExtendNode {}
  interface INode extends IBaseExtendNode {}
  interface IHTMLElement extends IBaseExtendNode {}
  interface INodeList extends IBaseExtendNodeList {}
  interface IHTMLCollection extends IBaseExtendNodeList {}
}

type INodeExtensionFns = Omit<IBaseExtendNode, '$isClickable' | '$isVisible' | '$exists'>;
const NodeExtensionFns: INodeExtensionFns = {
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
  async $waitForVisible(options?: { timeoutMs?: number }): Promise<ISuperElement> {
    const { awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;

    return await coreFrame.waitForElement(this, {
      waitForVisible: true,
      ...options,
    });
  },
  async $waitForClickable(options?: { timeoutMs?: number }): Promise<ISuperElement> {
    const { awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;

    return await coreFrame.waitForElement(this, {
      waitForClickable: true,
      ...options,
    });
  },
  async $waitForExists(options?: { timeoutMs?: number }): Promise<ISuperElement> {
    const { awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;

    return await coreFrame.waitForElement(this, options);
  },
  async $waitForHidden(options?: { timeoutMs?: number }): Promise<ISuperElement> {
    const { awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;
    return await coreFrame.waitForElement(this, {
      waitForHidden: true,
      ...options,
    });
  },
  async $clearValue(): Promise<void> {
    const { awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;
    await Interactor.run(coreFrame, [
      { click: this },
      { keyDown: KeyboardKey.Meta, keyPress: KeyboardKey.a },
      { keyUp: KeyboardKey.Meta },
      { keyPress: KeyboardKey.Backspace },
    ]);
  },
};

type INodeExtensionGetters = { [name: string]: () => any };
const NodeExtensionGetters: INodeExtensionGetters = {
  async $isClickable(): Promise<boolean> {
    const coreFrame = await getCoreFrame(this);
    const visibility = await coreFrame.getComputedVisibility(this);
    return visibility.isClickable;
  },
  async $exists(): Promise<boolean> {
    const coreFrame = await getCoreFrame(this);
    const visibility = await coreFrame.getComputedVisibility(this);
    return visibility.nodeExists;
  },
  async $isVisible(): Promise<boolean> {
    const coreFrame = await getCoreFrame(this);
    const visibility = await coreFrame.getComputedVisibility(this);
    return visibility.isVisible;
  },
};

const NodeListExtensionFns: IBaseExtendNodeList = {
  async $map<T = any>(iteratorFn: (node: ISuperNode, index: number) => Promise<T>): Promise<T[]> {
    let i = 0;
    const newArray: T[] = [];
    const nodes = await this;
    for (const node of nodes) {
      const newItem = await iteratorFn(node, ++i);
      newArray.push(newItem);
    }
    return newArray;
  },
  async $reduce<T = any>(
    iteratorFn: (initial: T, node: ISuperNode) => Promise<T>,
    initial: T,
  ): Promise<T> {
    const nodes = await this;
    for (const node of nodes) {
      initial = await iteratorFn(initial, node);
    }
    return initial;
  },
};

export function extendNodes<IFunctions, IGetters>(functions: IFunctions, getters?: IGetters): void {
  for (const Item of [SuperElement, SuperNode, SuperHTMLElement, Element, Node, HTMLElement]) {
    for (const [key, value] of Object.entries(functions)) {
      void Object.defineProperty(Item.prototype, key, {
        enumerable: false,
        configurable: false,
        writable: false,
        value,
      });
    }
    for (const [key, get] of Object.entries(getters)) {
      void Object.defineProperty(Item.prototype, key, {
        enumerable: false,
        configurable: false,
        get,
      });
    }
  }
}

export function extendNodeLists(functions: { [name: string]: any }): void {
  for (const Item of [SuperNodeList, SuperHTMLCollection, NodeList, HTMLCollection]) {
    for (const [key, value] of Object.entries(functions)) {
      void Object.defineProperty(Item.prototype, key, {
        enumerable: false,
        configurable: false,
        writable: false,
        value,
      });
    }
  }
}

async function getCoreFrame(element: ISuperElement): Promise<CoreFrameEnvironment> {
  const { awaitedOptions } = awaitedPathState.getState(element);
  return await awaitedOptions.coreFrame;
}

extendNodes<INodeExtensionFns, INodeExtensionGetters>(NodeExtensionFns, NodeExtensionGetters);
extendNodeLists(NodeListExtensionFns);

export {
  awaitedPathState,
};
