import {
  IInteractionGroup,
  IInteractionGroups,
  IInteractionStep,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
  isMousePositionXY,
} from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import { assert } from '@ulixee/commons/lib/utils';
import {
  getKeyboardKey,
  IKeyboardKey,
  KeyboardKey,
} from '@ulixee/unblocked-specification/agent/interact/IKeyboardLayoutUS';
import IInteractionsHelper, {
  IRectLookup,
  IViewportSize,
} from '@ulixee/unblocked-specification/agent/interact/IInteractionsHelper';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { INodePointer, IJsPath, INodeVisibility } from '@ulixee/js-path';
import IPoint from '@ulixee/unblocked-specification/agent/browser/IPoint';
import IMouseResult from '@ulixee/unblocked-specification/agent/interact/IMouseResult';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { IInteractHooks } from '@ulixee/unblocked-specification/agent/hooks/IHooks';
import IRect from '@ulixee/unblocked-specification/agent/browser/IRect';
import { IKeyboard, IMouse } from '@ulixee/unblocked-specification/agent/interact/IInput';
import IWindowOffset from '@ulixee/unblocked-specification/agent/browser/IWindowOffset';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Frame from './Frame';
import { JsPath } from './JsPath';
import MouseListener from './MouseListener';
import * as rectUtils from './rectUtils';
import BrowserContext from './BrowserContext';

const commandsNeedingScroll = new Set([
  InteractionCommand.click,
  InteractionCommand.doubleclick,
  InteractionCommand.move,
]);

const mouseCommands = new Set(
  [
    InteractionCommand.move,
    InteractionCommand.click,
    InteractionCommand.doubleclick,
    InteractionCommand.click,
    InteractionCommand.clickUp,
    InteractionCommand.clickDown,
  ].map(String),
);

export default class Interactor implements IInteractionsHelper {
  public get mousePosition(): IPoint {
    return { ...this.mouse.position };
  }

  public get scrollOffset(): Promise<IRect> {
    return this.getWindowOffset().then(offset => {
      return {
        x: offset.scrollX,
        y: offset.scrollY,
        width: offset.scrollWidth,
        height: offset.scrollHeight,
      };
    });
  }

  public get doesBrowserAnimateScrolling(): boolean {
    return this.browserContext.browser.engine.doesBrowserAnimateScrolling;
  }

  public beforeEachInteractionStep: (
    interactionStep: IInteractionStep,
    isMouseCommand: boolean,
  ) => Promise<void>;

  public afterEachInteractionStep: (
    interactionStep: IInteractionStep,
    startTime: number,
  ) => Promise<void>;

  public afterInteractionGroups: () => Promise<void>;

  public logger: IBoundLog;

  public viewportSize: IViewportSize;

  // Publish rect utils
  public isPointWithinRect = rectUtils.isPointWithinRect;
  public createPointInRect = rectUtils.createPointInRect;
  public createScrollPointForRect = rectUtils.createScrollPointForRect;
  public isRectInViewport = rectUtils.isRectInViewport;

  private preInteractionPaintStableStatus: { isStable: boolean; timeUntilReadyMs?: number };

  private isReady: Promise<void>;

  private readonly frame: Frame;

  private get hooks(): IInteractHooks {
    return this.frame.hooks;
  }

  private get browserContext(): BrowserContext {
    return this.frame.page.browserContext;
  }

  private get jsPath(): JsPath {
    return this.frame.jsPath;
  }

  private get mouse(): IMouse {
    return this.frame.page.mouse;
  }

  private get keyboard(): IKeyboard {
    return this.frame.page.keyboard;
  }

  private playAllInteractions: IInteractHooks['playInteractions'] =
    Interactor.defaultPlayInteractions;

  constructor(frame: Frame) {
    this.frame = frame;
    this.logger = frame.logger.createChild(module);
    if (this.hooks.playInteractions) {
      this.playAllInteractions = this.hooks.playInteractions.bind(this.hooks);
    }
  }

  public async initialize(): Promise<void> {
    // can't run javascript if active dialog!
    if (this.frame.page.activeDialog) return;
    this.isReady ??= this.initializeViewport(!this.frame.parentId);
    return await this.isReady;
  }

  public play(interactions: IInteractionGroups, resolvablePromise: IResolvablePromise<any>): void {
    this.browserContext.commandMarker.incrementMark?.('interact');
    this.preInteractionPaintStableStatus = this.frame.navigations.getPaintStableStatus();

    this.logger.info('Interactor.play', { interactions });

    this.injectScrollToPositions(interactions)
      .then(async finalInteractions => {
        try {
          await this.initialize();
          return await this.playAllInteractions(
            finalInteractions,
            this.playInteraction.bind(this, resolvablePromise),
            this,
          );
        } finally {
          // eslint-disable-next-line promise/always-return
          await this.afterInteractionGroups?.();
        }
      })
      .then(resolvablePromise.resolve)
      .catch(resolvablePromise.reject);
  }

  public async reloadJsPath(jsPath: IJsPath): Promise<INodePointer> {
    const containerOffset = await this.frame.getContainerOffset();
    const result = await this.jsPath.reloadJsPath(jsPath, containerOffset);
    return result.nodePointer;
  }

  public async lookupBoundingRect(
    mousePosition: IMousePosition,
    options?: {
      relativeToScrollOffset?: IPoint;
      includeNodeVisibility?: boolean;
      useLastKnownPosition?: boolean;
    },
  ): Promise<IRectLookup> {
    if (mousePosition === null) {
      throw new Error('Null mouse position provided to frame.interact');
    }

    if (isMousePositionXY(mousePosition)) {
      let [x, y] = mousePosition as IMousePositionXY;
      x = Math.round(x);
      y = Math.round(y);
      if (options?.relativeToScrollOffset) {
        const currentScrollOffset = await this.scrollOffset;
        const { relativeToScrollOffset } = options;
        y = y + relativeToScrollOffset.y - currentScrollOffset.y;
        x = x + relativeToScrollOffset.x - currentScrollOffset.x;
      }

      return {
        x,
        y,
        width: 1,
        height: 1,
      };
    }

    if (
      options?.useLastKnownPosition &&
      typeof mousePosition[0] === 'number' &&
      mousePosition.length === 1
    ) {
      const nodeId = mousePosition[0] as number;
      const lastKnownPosition = this.jsPath.getLastClientRect(nodeId);
      if (lastKnownPosition) {
        const currentScroll = await this.scrollOffset;
        return {
          x: lastKnownPosition.x + lastKnownPosition.scrollX - currentScroll.x,
          y: lastKnownPosition.y + lastKnownPosition.scrollY - currentScroll.y,
          height: lastKnownPosition.height,
          width: lastKnownPosition.width,
          elementTag: lastKnownPosition.tag,
          nodeId,
        };
      }
    }

    const rectResult = await this.jsPath.getClientRect(
      mousePosition,
      options?.includeNodeVisibility,
    );

    const rect = rectResult.value;
    const nodePointer = rectResult.nodePointer as INodePointer;
    if (!nodePointer) throw new Error('Element does not exist.');

    return {
      x: rect.x,
      y: rect.y,
      height: rect.height,
      width: rect.width,
      elementTag: rect.tag,
      nodeId: nodePointer?.id,
      nodeVisibility: rect.nodeVisibility,
    };
  }

  public async createMousedownTrigger(nodeId: number): Promise<{
    nodeVisibility: INodeVisibility;
    didTrigger: () => Promise<IMouseResult>;
  }> {
    assert(nodeId, 'nodeId should not be null');
    const mouseListener = new MouseListener(this.frame, nodeId);
    const nodeVisibility = await mouseListener.register();

    let mouseResult: IMouseResult;

    return {
      nodeVisibility,
      didTrigger: async () => {
        if (mouseResult) return mouseResult;

        mouseResult = await mouseListener.didTriggerMouseEvent();
        mouseResult.didStartInteractWithPaintingStable =
          this.preInteractionPaintStableStatus?.isStable === true;
        return mouseResult;
      },
    };
  }

  private async playInteraction(
    resolvable: IResolvablePromise<any>,
    interactionStep: IInteractionStep,
  ): Promise<void> {
    if (resolvable.isResolved) {
      this.logger.warn('Canceling interaction due to external event');
      throw new CanceledPromiseError('Canceling interaction due to external event');
    }
    const startTime = Date.now();
    await this.beforeEachInteractionStep?.(
      interactionStep,
      mouseCommands.has(interactionStep.command),
    );

    switch (interactionStep.command) {
      case InteractionCommand.move: {
        const [x, y] = await this.getMousePositionXY(interactionStep);
        await this.mouse.move(x, y);
        break;
      }
      case InteractionCommand.scroll: {
        const scrollOffset = await this.scrollOffset;

        let scrollToY = scrollOffset.y;
        let scrollToX = scrollOffset.x;
        // if this is a JsPath, see if we actually need to scroll
        if (isMousePositionXY(interactionStep.mousePosition) === false) {
          const interactRect = await this.getInteractionRect(interactionStep);
          const isRectVisible = this.isRectInViewport(interactRect, this.viewportSize, 50);
          if (isRectVisible.all) return;

          const pointForRect = this.createScrollPointForRect(interactRect, this.viewportSize);

          // positions are all relative to viewport, so normalize based on the current offsets
          if (!isRectVisible.height) scrollToY += pointForRect.y;
          if (!isRectVisible.width) scrollToX += pointForRect.x;
        } else {
          [scrollToX, scrollToY] = interactionStep.mousePosition as IMousePositionXY;
        }

        const maxX = scrollOffset.width - this.viewportSize.width - scrollOffset.x;
        const maxY = scrollOffset.height - this.viewportSize.height - scrollOffset.y;
        const deltaX = Math.min(scrollToX - scrollOffset.x, maxX);
        const deltaY = Math.min(scrollToY - scrollOffset.y, maxY);

        if (deltaY !== 0 || deltaX !== 0) {
          await this.mouse.wheel({ deltaX, deltaY });
          // need to check for offset since wheel event doesn't wait for scroll
          await this.frame.waitForScrollStop();
        }
        break;
      }

      case InteractionCommand.click:
      case InteractionCommand.clickUp:
      case InteractionCommand.clickDown:
      case InteractionCommand.doubleclick: {
        const { delayMillis, mouseButton, command, mouseResultVerifier } = interactionStep;
        let interactRect: IRectLookup;
        // if this is a jsPath, need to look it up
        if (
          interactionStep.mousePosition &&
          isMousePositionXY(interactionStep.mousePosition) === false
        ) {
          interactRect = await this.getInteractionRect(interactionStep);
          if (interactRect.elementTag === 'option') {
            // options need a browser level call
            interactionStep.simulateOptionClickOnNodeId = interactRect.nodeId;
            interactionStep.verification = 'none';
          }
        }

        if (command === InteractionCommand.click && interactionStep.simulateOptionClickOnNodeId) {
          await this.jsPath.simulateOptionClick([interactionStep.simulateOptionClickOnNodeId]);
          break;
        }

        const [x, y] = await this.getMousePositionXY(interactionStep, true, interactRect);
        await this.mouse.move(x, y);

        const button = mouseButton || 'left';
        const clickCount = command === InteractionCommand.doubleclick ? 2 : 1;

        if (command !== InteractionCommand.clickUp) {
          await this.mouse.down({ button, clickCount });
        }
        if (delayMillis) {
          await waitFor(delayMillis, resolvable);
        }

        // don't click up if verification failed
        if (mouseResultVerifier) {
          const result = await mouseResultVerifier();
          if (!result.didClickLocation) break;
        }

        if (command !== InteractionCommand.clickDown) {
          await this.mouse.up({ button, clickCount });
        }

        break;
      }

      case InteractionCommand.type: {
        let counter = 0;
        for (const keyboardCommand of interactionStep.keyboardCommands) {
          const delay = interactionStep.keyboardDelayBetween;
          const keyupDelay = interactionStep.keyboardKeyupDelay;
          if (counter > 0 && delay) {
            await waitFor(delay, resolvable);
          }

          if ('keyCode' in keyboardCommand) {
            const key = getKeyboardKey(keyboardCommand.keyCode);
            await this.keyboard.press(key, keyupDelay);
          } else if ('up' in keyboardCommand) {
            const key = getKeyboardKey(keyboardCommand.up);
            await this.keyboard.up(key);
          } else if ('down' in keyboardCommand) {
            const key = getKeyboardKey(keyboardCommand.down);
            await this.keyboard.down(key);
          } else if ('shortcut' in keyboardCommand) {
            await this.keyboard.command(keyboardCommand.shortcut);
          } else if ('string' in keyboardCommand) {
            const text = keyboardCommand.string;
            for (const char of text) {
              if (char in KeyboardKey) {
                await this.keyboard.press(char as IKeyboardKey, keyupDelay);
              } else {
                await this.keyboard.sendCharacter(char);
              }
              if (delay) await waitFor(delay, resolvable);
            }
          }
          counter += 1;
        }
        break;
      }

      case InteractionCommand.waitForMillis: {
        await waitFor(interactionStep.delayMillis, resolvable);
        break;
      }
    }
    await this.afterEachInteractionStep?.(interactionStep, startTime);
  }

  private async getWindowOffset(): Promise<IWindowOffset> {
    const windowOffset = await this.frame.getWindowOffset();
    this.viewportSize = { width: windowOffset.innerWidth, height: windowOffset.innerHeight };
    return windowOffset;
  }

  private async initializeViewport(isMainFrame: boolean): Promise<void> {
    await this.getWindowOffset();
    if (isMainFrame) {
      await this.hooks?.adjustStartingMousePoint?.(this.mouse.position, this);
    }
  }

  private async getInteractionRect(interactionStep: IInteractionStep): Promise<IRectLookup> {
    const mousePosition = interactionStep.mousePosition;
    return await this.lookupBoundingRect(mousePosition, {
      relativeToScrollOffset: interactionStep.relativeToScrollOffset,
      useLastKnownPosition: interactionStep.verification === 'none',
    });
  }

  private async getMousePositionXY(
    interactionStep: IInteractionStep,
    constrainToViewport = true,
    rect?: IRectLookup,
  ): Promise<[x: number, y: number]> {
    if (!interactionStep.mousePosition) return [this.mouse.position.x, this.mouse.position.y];
    rect ??= await this.getInteractionRect(interactionStep);

    if (isMousePositionXY(interactionStep.mousePosition)) {
      return [rect.x, rect.y];
    }

    const point = await rectUtils.createPointInRect(rect, {
      paddingPercent: { height: 10, width: 10 },
      constrainToViewport: constrainToViewport ? this.viewportSize : undefined,
    });
    return [point.x, point.y];
  }

  private async injectScrollToPositions(
    interactions: IInteractionGroups,
  ): Promise<IInteractionGroups> {
    const finalInteractions: IInteractionGroups = [];
    let relativeToScrollOffset: IPoint;
    for (const group of interactions) {
      const groupCommands: IInteractionGroup = [];
      finalInteractions.push(groupCommands);
      for (const step of group) {
        if (commandsNeedingScroll.has(InteractionCommand[step.command]) && step.mousePosition) {
          if (isMousePositionXY(step.mousePosition)) {
            relativeToScrollOffset ??= await this.scrollOffset;
          }
          groupCommands.push({
            command: InteractionCommand.scroll,
            mousePosition: step.mousePosition,
            verification: step.verification,
            relativeToScrollOffset,
          });
          step.relativeToScrollOffset = relativeToScrollOffset;
        }
        groupCommands.push(step);
      }
    }
    return finalInteractions;
  }

  public static async defaultPlayInteractions(
    interactionGroups: IInteractionGroups,
    runFn: (interactionStep: IInteractionStep) => Promise<void>,
  ): Promise<void> {
    for (const group of interactionGroups) {
      for (const step of group) {
        await runFn(step);
      }
    }
  }
}

async function waitFor(millis: number, resolvable: IResolvablePromise): Promise<void> {
  if (millis === undefined || millis === null) return;

  await Promise.race([
    resolvable.promise,
    new Promise(resolve => setTimeout(resolve, millis).unref()),
  ]);
}
