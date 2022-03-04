import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement, ISuperNode } from 'awaited-dom/base/interfaces/super';
import type {} from 'awaited-dom/base/interfaces/official';
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
import XPathResult from 'awaited-dom/impl/official-klasses/XPathResult';
import { createSuperNode } from 'awaited-dom/impl/create';
import { getAwaitedPathAsMethodArg } from './SetupAwaitedHandler';
import { KeyboardShortcuts } from '@ulixee/hero-interfaces/IKeyboardShortcuts';
import { scriptInstance } from './internal';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

interface IBaseExtendNode {
  $isVisible: Promise<boolean>;
  $exists: Promise<boolean>;
  $isClickable: Promise<boolean>;
  $hasFocus: Promise<boolean>;
  $clearInputText(): Promise<void>;
  $click(verification?: IElementInteractVerification): Promise<void>;
  $type(...typeInteractions: ITypeInteraction[]): Promise<void>;
  $waitForExists(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForClickable(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForHidden(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForVisible(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $xpathSelector(selector: string): ISuperNode;
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

type INodeExtensionFns = Omit<
  IBaseExtendNode,
  '$isClickable' | '$isVisible' | '$exists' | '$hasFocus'
>;
const NodeExtensionFns: INodeExtensionFns = {
  async $click(verification: IElementInteractVerification = 'elementAtPath'): Promise<void> {
    const coreFrame = await getCoreFrame(this);
    await Interactor.run(coreFrame, [{ click: { element: this, verification } }]);
  },
  async $type(...typeInteractions: ITypeInteraction[]): Promise<void> {
    const coreFrame = await getCoreFrame(this);
    await this.focus();
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
  async $clearInputText(): Promise<void> {
    const { awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;
    const callsitePath = scriptInstance.getScriptCallsite();
    await coreFrame.coreTab.runFlowCommand(
      async () => {
        await this.focus();
        await Interactor.run(coreFrame, [
          { keyShortcut: KeyboardShortcuts.selectAll },
          { keyPress: KeyboardKey.Backspace },
        ]);
      },
      assert => {
        assert(this.value, x => !x);
      },
      callsitePath,
    );
  },
  $xpathSelector(selector: string, orderedNodeResults = false): ISuperNode {
    const { awaitedOptions, awaitedPath } = awaitedPathState.getState(this);
    const newPath = new AwaitedPath(
      null,
      'document',
      [
        'evaluate',
        selector,
        getAwaitedPathAsMethodArg(awaitedPath),
        null,
        orderedNodeResults
          ? XPathResult.FIRST_ORDERED_NODE_TYPE
          : XPathResult.ANY_UNORDERED_NODE_TYPE,
      ],
      'singleNodeValue',
    );
    return createSuperNode(newPath, awaitedOptions);
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
  async $hasFocus(): Promise<boolean> {
    const coreFrame = await getCoreFrame(this);
    return coreFrame.isFocused(this);
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

export { awaitedPathState };
