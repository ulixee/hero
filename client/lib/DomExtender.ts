import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import { ISuperElementProperties } from 'awaited-dom/base/super-klasses/SuperElement';
import SuperElement from 'awaited-dom/impl/super-klasses/SuperElement';
import SuperNode from 'awaited-dom/impl/super-klasses/SuperNode';
import SuperHTMLElement from 'awaited-dom/impl/super-klasses/SuperHTMLElement';
import Element from 'awaited-dom/impl/official-klasses/Element';
import Node from 'awaited-dom/impl/official-klasses/Node';
import HTMLElement from 'awaited-dom/impl/official-klasses/HTMLElement';
import { ITypeInteraction } from '../interfaces/IInteractions';
import Interactor from './Interactor';
import { INodeVisibility, INodeVisibilityOptions } from '@ulixee/hero-interfaces/INodeVisibility';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import { createInstanceWithNodePointer } from './SetupAwaitedHandler';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import INodePointer from 'awaited-dom/base/INodePointer';
import { IElementInteractVerification } from '@ulixee/hero-interfaces/IInteractions';

const { getState } = StateMachine<ISuperElement, ISuperElementProperties>();
const awaitedPathState = StateMachine<
  any,
  { awaitedPath: AwaitedPath; awaitedOptions: IAwaitedOptions; nodePointer?: INodePointer }
>();

interface IBaseExtend {
  $click: (verification?: IElementInteractVerification) => Promise<void>;
  $type: (...typeInteractions: ITypeInteraction[]) => Promise<void>;
  $waitForVisible: (
    options?: { timeoutMs?: number } & INodeVisibilityOptions,
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

const propertyDefinition: PropertyDescriptor = {
  enumerable: false,
  configurable: false,
  writable: false,
};

for (const Item of [SuperElement, SuperNode, SuperHTMLElement, Element, Node, HTMLElement]) {
  void Object.defineProperty(Item.prototype, '$click', {
    async value(verification: IElementInteractVerification = 'elementAtPath'): Promise<void> {
      const { awaitedOptions } = getState(this);
      const coreFrame: CoreFrameEnvironment = await awaitedOptions?.coreFrame;
      await Interactor.run(coreFrame, [{ click: { element: this, verification } }]);
    },
    ...propertyDefinition,
  });

  void Object.defineProperty(Item.prototype, '$type', {
    async value(...typeInteractions: ITypeInteraction[]): Promise<void> {
      const { awaitedOptions } = getState(this);
      const coreFrame: CoreFrameEnvironment = await awaitedOptions?.coreFrame;
      await this.$click();
      await Interactor.run(
        coreFrame,
        typeInteractions.map(t => ({ type: t })),
      );
    },
    ...propertyDefinition,
  });

  void Object.defineProperty(Item.prototype, '$waitForVisible', {
    async value(options?: { timeoutMs?: number } & INodeVisibilityOptions): Promise<ISuperElement> {
      const { awaitedPath, awaitedOptions } = getState(this);
      const coreFrame: CoreFrameEnvironment = await awaitedOptions?.coreFrame;
      const visibilityOptions: any = {};
      if (options) {
        for (const [key, value] of Object.entries(options)) {
          if (key !== 'timeoutMs' && typeof value === 'boolean') {
            visibilityOptions[key] = value;
          }
        }
      }
      if (!Object.keys(visibilityOptions).length) {
        visibilityOptions.isVisible = true;
      }
      const nodePointer = await coreFrame.waitForElement(awaitedPath.toJSON(), {
        waitForVisible: true,
        timeoutMs: options?.timeoutMs,
      });
      if (!nodePointer) return null;
      return createInstanceWithNodePointer(
        awaitedPathState,
        awaitedPath,
        awaitedOptions,
        nodePointer,
      );
    },
    ...propertyDefinition,
  });

  void Object.defineProperty(Item.prototype, '$getComputedVisibility', {
    async value(): Promise<void> {
      const { awaitedOptions } = getState(this);
      const coreFrame: CoreFrameEnvironment = await awaitedOptions?.coreFrame;
      await coreFrame.getComputedVisibility(this);
    },
    ...propertyDefinition,
  });
}
