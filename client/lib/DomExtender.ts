import StateMachine from '@ulixee/awaited-dom/base/StateMachine';
import { ISuperElement, ISuperNode, ISuperHTMLElement, ISuperNodeList, ISuperHTMLCollection } from '@ulixee/awaited-dom/base/interfaces/super';
import SuperElement from '@ulixee/awaited-dom/impl/super-klasses/SuperElement';
import SuperNode from '@ulixee/awaited-dom/impl/super-klasses/SuperNode';
import SuperHTMLElement from '@ulixee/awaited-dom/impl/super-klasses/SuperHTMLElement';
import Element from '@ulixee/awaited-dom/impl/official-klasses/Element';
import Node from '@ulixee/awaited-dom/impl/official-klasses/Node';
import NodeList from '@ulixee/awaited-dom/impl/official-klasses/NodeList';
import HTMLCollection from '@ulixee/awaited-dom/impl/official-klasses/HTMLCollection';
import HTMLElement from '@ulixee/awaited-dom/impl/official-klasses/HTMLElement';
import AwaitedPath from '@ulixee/awaited-dom/base/AwaitedPath';
import { INodePointer } from '@ulixee/js-path';
import { IElementInteractVerification } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import SuperNodeList from '@ulixee/awaited-dom/impl/super-klasses/SuperNodeList';
import SuperHTMLCollection from '@ulixee/awaited-dom/impl/super-klasses/SuperHTMLCollection';
import { KeyboardKey } from '@ulixee/unblocked-specification/agent/interact/IKeyboardLayoutUS';
import XPathResult from '@ulixee/awaited-dom/impl/official-klasses/XPathResult';
import { createSuperDocument, createSuperNode } from '@ulixee/awaited-dom/impl/create';
import { KeyboardShortcuts } from '@ulixee/unblocked-specification/agent/interact/IKeyboardShortcuts';
import SuperDocument from '@ulixee/awaited-dom/impl/super-klasses/SuperDocument';
import { IElement, IHTMLCollection, IHTMLElement, INode, INodeList } from '@ulixee/awaited-dom/base/interfaces/official';
import { ITypeInteraction } from '../interfaces/IInteractions';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import Interactor from './Interactor';
import { getAwaitedPathAsMethodArg } from './SetupAwaitedHandler';
import DetachedElement from './DetachedElement';

const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

interface IBaseExtendNode {
  $isVisible: Promise<boolean>;
  $exists: Promise<boolean>;
  $isClickable: Promise<boolean>;
  $hasFocus: Promise<boolean>;
  $contentDocument: SuperDocument;
  $clearInputText(): Promise<void>;
  $click(verification?: IElementInteractVerification): Promise<void>;
  $type(...typeInteractions: ITypeInteraction[]): Promise<void>;
  $waitForExists(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForClickable(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForHidden(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $waitForVisible(options?: { timeoutMs?: number }): Promise<ISuperElement>;
  $xpathSelector(selector: string): ISuperNode;
  $detach(): Promise<globalThis.Element>;
  $addToDetachedElements(name: string): Promise<void>;
}

interface IBaseExtendNodeList {
  $map<T = any>(iteratorFn: (node: ISuperNode, index: number) => Promise<T>): Promise<T[]>;
  $reduce<T = any>(
    iteratorFn: (initial: T, node: ISuperNode) => Promise<T>,
    initial: T,
  ): Promise<T>;
  $detach(): Promise<globalThis.Element[]>;
  $addToDetachedElements(name?: string): Promise<void>;
}

declare module '@ulixee/awaited-dom/base/interfaces/super' {
  interface ISuperElement extends IBaseExtendNode {}
  interface ISuperNode extends IBaseExtendNode {}
  interface ISuperHTMLElement extends IBaseExtendNode {}
  interface ISuperNodeList extends IBaseExtendNodeList {}
  interface ISuperHTMLCollection extends IBaseExtendNodeList {}
}

declare module '@ulixee/awaited-dom/base/interfaces/official' {
  interface IElement extends IBaseExtendNode {}
  interface INode extends IBaseExtendNode {}
  interface IHTMLElement extends IBaseExtendNode {}
  interface INodeList extends IBaseExtendNodeList {}
  interface IHTMLCollection extends IBaseExtendNodeList {}
}

type INodeExtensionFns = Omit<
  IBaseExtendNode,
  '$isClickable' | '$isVisible' | '$exists' | '$hasFocus' | '$contentDocument'
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
    const callsitePath = coreFrame.coreTab.coreSession.callsiteLocator.getCurrent();
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
  async $detach(): Promise<globalThis.Element> {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;
    const detachedElementsRaw = await coreFrame.detachElement(undefined, awaitedPath.toJSON(), true, false);
    return DetachedElement.load(detachedElementsRaw[0].outerHTML);
  },
  async $addToDetachedElements(name: string): Promise<void> {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;
    await coreFrame.detachElement(name, awaitedPath.toJSON(), false, true);
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
  $contentDocument(): SuperDocument {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
    const frameJsPath = awaitedPath.toJSON();
    const frameAwaitedPath = new AwaitedPath(null, 'document');
    return createSuperDocument<IAwaitedOptions>(frameAwaitedPath, {
      coreFrame: awaitedOptions.coreFrame
        .then(x => {
          return Promise.all([x.coreTab, x.getChildFrameEnvironment(frameJsPath)]);
        })
        .then(([coreTab, frameMeta]) => coreTab.getCoreFrameForMeta(frameMeta)),
    }) as SuperDocument;
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
  async $detach(): Promise<globalThis.Element[]> {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;
    const detachedElementsRaw = await coreFrame.detachElement(undefined, awaitedPath.toJSON(), true, false);
    return detachedElementsRaw.map(x => DetachedElement.load(x.outerHTML));
  },
  async $addToDetachedElements(name: string): Promise<void> {
    const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
    const coreFrame = await awaitedOptions.coreFrame;
    await coreFrame.detachElement(name, awaitedPath.toJSON(), false, true);
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

export function isDomExtensionClass(instance: any): boolean {
  if (instance instanceof SuperElement) return true;
  if (instance instanceof SuperNode) return true;
  if (instance instanceof SuperHTMLElement) return true;
  if (instance instanceof Element) return true;
  if (instance instanceof Node) return true;
  if (instance instanceof HTMLElement) return true;
  if (instance instanceof SuperNodeList) return true;
  if (instance instanceof SuperHTMLCollection) return true;
  if (instance instanceof NodeList) return true;
  if (instance instanceof HTMLCollection) return true;
  return false;
}

export type IDomExtensionClass = ISuperElement | ISuperNode | ISuperHTMLElement | IElement | INode | IHTMLElement | ISuperNodeList | ISuperHTMLCollection | INodeList | IHTMLCollection;

async function getCoreFrame(element: ISuperElement): Promise<CoreFrameEnvironment> {
  const { awaitedOptions } = awaitedPathState.getState(element);
  return await awaitedOptions.coreFrame;
}

extendNodes<INodeExtensionFns, INodeExtensionGetters>(NodeExtensionFns, NodeExtensionGetters);
extendNodeLists(NodeListExtensionFns);

export { awaitedPathState };
