import StateMachine from 'awaited-dom/base/StateMachine';
import { ISuperElement } from 'awaited-dom/base/interfaces/super';
import { ISuperElementProperties } from 'awaited-dom/base/super-klasses/SuperElement';
import SuperElement from 'awaited-dom/impl/super-klasses/SuperElement';
import Interactor from './Interactor';
import { ITypeInteraction } from '../interfaces/IInteractions';

const { getState } = StateMachine<ISuperElement, ISuperElementProperties>();

interface IBaseExtend {
  $: {
    click: () => Promise<void>;
    type: () => Promise<void>;
    waitForVisible: () => Promise<void>;
  }
}

declare module 'awaited-dom/base/interfaces/super' {
  interface ISuperElement extends IBaseExtend {}
  interface ISuperNode extends IBaseExtend {}
  interface ISuperHTMLElement extends IBaseExtend {}
}

Object.defineProperty(SuperElement.prototype, '$', {
  get: function $() {
      const click = async (): Promise<void> => {
        const { awaitedOptions } = getState(this);
        const coreFrame = await awaitedOptions?.coreFrame
        await Interactor.run(coreFrame, [{ click: this }]);
      };
      const type = async (...typeInteractions: ITypeInteraction[]): Promise<void> => {
        const { awaitedOptions } = getState(this);
        const coreFrame = await awaitedOptions?.coreFrame
        await click();
        await Interactor.run(
          coreFrame,
          typeInteractions.map(t => ({ type: t })),
        );
      };
      const waitForVisible = async (): Promise<void> => {
        const { awaitedPath, awaitedOptions } = getState(this);
        const coreFrame = await awaitedOptions?.coreFrame
        await coreFrame.waitForElement(awaitedPath.toJSON(), { waitForVisible: true });
      };

    return { click, type, waitForVisible };
  }
});
