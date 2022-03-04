import {
  IInteractionGroup,
  IInteractionGroups,
  IInteractionStep,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
  isMousePositionXY,
} from '@ulixee/hero-interfaces/IInteractions';
import { assert } from '@ulixee/commons/lib/utils';
import {
  getKeyboardKey,
  IKeyboardKey,
  KeyboardKey,
} from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import IInteractionsHelper, {
  IRectLookup,
  IViewportSize,
} from '@ulixee/hero-interfaces/IInteractionsHelper';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Log from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { INodePointer } from '@ulixee/hero-interfaces/AwaitedDom';
import IPoint from '@ulixee/hero-interfaces/IPoint';
import IMouseResult from '@ulixee/hero-interfaces/IMouseResult';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { IPuppetKeyboard, IPuppetMouse } from '@ulixee/hero-interfaces/IPuppetInput';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import IElementRect from '@ulixee/hero-interfaces/IElementRect';
import { getClientRectFnName } from '@ulixee/hero-interfaces/jsPathFnNames';
import Tab from './Tab';
import FrameEnvironment from './FrameEnvironment';
import { JsPath } from './JsPath';
import MouseListener from './MouseListener';
import * as rectUtils from './rectUtils';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import IWindowOffset from '@ulixee/hero-interfaces/IWindowOffset';
import IRect from '@ulixee/hero-interfaces/IRect';

const { log } = Log(module);

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
    return this.tab.session.browserEngine.doesBrowserAnimateScrolling;
  }

  public logger: IBoundLog;

  public viewportSize: IViewportSize;

  // Publish rect utils
  public isPointWithinRect = rectUtils.isPointWithinRect;
  public createPointInRect = rectUtils.createPointInRect;
  public createScrollPointForRect = rectUtils.createScrollPointForRect;
  public isRectInViewport = rectUtils.isRectInViewport;

  private preInteractionPaintStableStatus: { isStable: boolean; timeUntilReadyMs?: number };

  private isReady: Promise<void>;

  private readonly frameEnvironment: FrameEnvironment;

  private get tab(): Tab {
    return this.frameEnvironment.tab;
  }

  private get jsPath(): JsPath {
    return this.frameEnvironment.jsPath;
  }

  private get mouse(): IPuppetMouse {
    return this.tab.puppetPage.mouse;
  }

  private get keyboard(): IPuppetKeyboard {
    return this.tab.puppetPage.keyboard;
  }

  private get plugins(): ICorePlugins {
    return this.tab.session.plugins;
  }

  constructor(frameEnvironment: FrameEnvironment) {
    this.frameEnvironment = frameEnvironment;
    this.logger = log.createChild(module, {
      sessionId: frameEnvironment.session.id,
      frameId: frameEnvironment.id,
    });
  }

  public async initialize(isMainFrame: boolean): Promise<void> {
    this.isReady ??= this.initializeViewport(isMainFrame);
    return await this.isReady;
  }

  public play(interactions: IInteractionGroups, resolvablePromise: IResolvablePromise<any>): void {
    this.preInteractionPaintStableStatus = this.frameEnvironment.navigations.getPaintStableStatus();

    // eslint-disable-next-line promise/catch-or-return
    this.injectScrollToPositions(interactions)
      .then(finalInteractions =>
        this.plugins.playInteractions(
          finalInteractions,
          this.playInteraction.bind(this, resolvablePromise),
          this,
        ),
      )
      .then(resolvablePromise.resolve)
      .catch(resolvablePromise.reject)
      .finally(() => this.frameEnvironment.setInteractionDisplay(false));
  }

  public async reloadJsPath(jsPath: IJsPath): Promise<INodePointer> {
    const containerOffset = await this.frameEnvironment.getContainerOffset();
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
      throw new Error('Null mouse position provided to hero.interact');
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

    const containerOffset = await this.frameEnvironment.getContainerOffset();
    const rectResult = await this.jsPath.exec<IElementRect>(
      [...mousePosition, [getClientRectFnName, options?.includeNodeVisibility]],
      containerOffset,
    );
    const rect = rectResult.value;
    const nodePointer = rectResult.nodePointer as INodePointer;

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
    const mouseListener = new MouseListener(this.frameEnvironment, nodeId);
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
    interaction: IInteractionStep,
  ): Promise<void> {
    if (resolvable.isResolved) return;
    if (this.tab.isClosing) {
      throw new CanceledPromiseError('Canceling interaction - tab closing');
    }

    if (mouseCommands.has(interaction.command)) {
      this.frameEnvironment.setInteractionDisplay(true);
    }

    switch (interaction.command) {
      case InteractionCommand.move: {
        const [x, y] = await this.getMousePositionXY(interaction);
        await this.mouse.move(x, y);
        break;
      }
      case InteractionCommand.scroll: {
        const startScroll = await this.scrollOffset;
        const [x, y] = await this.getMousePositionXY(interaction, false);
        const maxX = startScroll.width - this.viewportSize.width;
        const maxY = startScroll.height - this.viewportSize.height;

        const deltaX = Math.min(x, maxX) - startScroll.x;
        const deltaY = Math.min(y, maxY) - startScroll.y;
        if (deltaY !== 0 || deltaX !== 0) {
          await this.mouse.wheel({ deltaX, deltaY });
          // need to check for offset since wheel event doesn't wait for scroll
          await this.jsPath.waitForScrollStop();
        }
        break;
      }

      case InteractionCommand.click:
      case InteractionCommand.clickUp:
      case InteractionCommand.clickDown:
      case InteractionCommand.doubleclick: {
        const { delayMillis, mouseButton, command, mouseResultVerifier } = interaction;

        if (command === InteractionCommand.click && interaction.simulateOptionClickOnNodeId) {
          await this.jsPath.simulateOptionClick([interaction.simulateOptionClickOnNodeId]);
          break;
        }

        const [x, y] = await this.getMousePositionXY(interaction);
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
        for (const keyboardCommand of interaction.keyboardCommands) {
          const delay = interaction.keyboardDelayBetween;
          const keyupDelay = interaction.keyboardKeyupDelay;
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
        await waitFor(interaction.delayMillis, resolvable);
        break;
      }
    }
  }

  private async getWindowOffset(): Promise<IWindowOffset> {
    const windowOffset = await this.jsPath.getWindowOffset();
    this.viewportSize = { width: windowOffset.innerWidth, height: windowOffset.innerHeight };
    return windowOffset;
  }

  private async initializeViewport(isMainFrame: boolean): Promise<void> {
    await this.getWindowOffset();
    if (isMainFrame) {
      const startingMousePosition = await this.plugins.getStartingMousePoint(this);
      this.mouse.position = startingMousePosition || this.mouse.position;
    }
  }

  private async getMousePositionXY(
    interactionStep: IInteractionStep,
    constrainToViewport = true,
  ): Promise<[x: number, y: number]> {
    const mousePosition = interactionStep.mousePosition;
    const rect = await this.lookupBoundingRect(mousePosition, {
      relativeToScrollOffset: interactionStep.relativeToScrollOffset,
      useLastKnownPosition: interactionStep.verification === 'none',
    });

    if (isMousePositionXY(mousePosition)) {
      return [rect.x, rect.y];
    } else {
      const point = await rectUtils.createPointInRect(rect, {
        paddingPercent: { height: 10, width: 10 },
        constrainToViewport: constrainToViewport ? this.viewportSize : undefined,
      });
      return [point.x, point.y];
    }
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
}

async function waitFor(millis: number, resolvable: IResolvablePromise): Promise<void> {
  if (millis === undefined || millis === null) return;

  await Promise.race([
    resolvable.promise,
    new Promise(resolve => setTimeout(resolve, millis).unref()),
  ]);
}
