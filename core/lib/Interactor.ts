import {
  IInteractionGroup,
  IInteractionGroups,
  IInteractionStep,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
} from '@ulixee/hero-interfaces/IInteractions';
import { assert } from '@ulixee/commons/lib/utils';
import {
  getKeyboardKey,
  IKeyboardKey,
  KeyboardKeys,
} from '@ulixee/hero-interfaces/IKeyboardLayoutUS';
import IInteractionsHelper from '@ulixee/hero-interfaces/IInteractionsHelper';
import IRect from '@ulixee/hero-interfaces/IRect';
import IWindowOffset from '@ulixee/hero-interfaces/IWindowOffset';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import Log from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { INodePointer } from '@ulixee/hero-interfaces/AwaitedDom';
import IPoint from '@ulixee/hero-interfaces/IPoint';
import IMouseUpResult from '@ulixee/hero-interfaces/IMouseUpResult';
import IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { IPuppetKeyboard, IPuppetMouse } from '@ulixee/hero-interfaces/IPuppetInput';
import ICorePlugins from '@ulixee/hero-interfaces/ICorePlugins';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import IElementRect from '@ulixee/hero-interfaces/IElementRect';
import { INodeVisibility } from '@ulixee/hero-interfaces/INodeVisibility';
import { getClientRectFnName, getNodeIdFnName } from '@ulixee/hero-interfaces/jsPathFnNames';
import Tab from './Tab';
import FrameEnvironment from './FrameEnvironment';
import { JsPath } from './JsPath';
import MouseupListener from './MouseupListener';
import MouseoverListener from './MouseoverListener';
import { formatJsPath } from './CommandFormatter';

const { log } = Log(module);

const commandsNeedingScroll = [
  InteractionCommand.click,
  InteractionCommand.doubleclick,
  InteractionCommand.move,
];

export default class Interactor implements IInteractionsHelper {
  public get mousePosition(): IPoint {
    return { ...this.mouse.position };
  }

  public get scrollOffset(): Promise<IPoint> {
    return this.jsPath.getWindowOffset().then(offset => {
      return {
        x: offset.scrollX,
        y: offset.scrollY,
      };
    });
  }

  public get viewport(): IViewport {
    return this.frameEnvironment.session.viewport;
  }

  public logger: IBoundLog;

  private preInteractionPaintStableStatus: { isStable: boolean; timeUntilReadyMs?: number };

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

  public async initialize(): Promise<void> {
    const startingMousePosition = await this.plugins.getStartingMousePoint(this);
    this.mouse.position = startingMousePosition || this.mouse.position;
  }

  public play(interactions: IInteractionGroups, resolvablePromise: IResolvablePromise<any>): void {
    const finalInteractions = Interactor.injectScrollToPositions(interactions);

    this.preInteractionPaintStableStatus = this.frameEnvironment.navigations.getPaintStableStatus();
    this.plugins
      .playInteractions(finalInteractions, this.playInteraction.bind(this, resolvablePromise), this)
      .then(resolvablePromise.resolve)
      .catch(resolvablePromise.reject);
  }

  public async lookupBoundingRect(
    mousePosition: IMousePosition,
    throwIfNotPresent = false,
    includeNodeVisibility = false,
  ): Promise<
    IRect & {
      elementTag?: string;
      nodeId?: number;
      nodeVisibility?: INodeVisibility;
    }
  > {
    if (isMousePositionCoordinate(mousePosition)) {
      return {
        x: mousePosition[0] as number,
        y: mousePosition[1] as number,
        width: 1,
        height: 1,
      };
    }
    if (mousePosition === null) {
      throw new Error('Null mouse position provided to hero.interact');
    }
    const jsPath = this.jsPath;
    const containerOffset = await this.frameEnvironment.getContainerOffset();
    const rectResult = await jsPath.exec<IElementRect>(
      [...mousePosition, [getClientRectFnName, includeNodeVisibility]],
      containerOffset,
    );
    const rect = rectResult.value;
    const nodePointer = rectResult.nodePointer as INodePointer;

    if (!nodePointer?.id && throwIfNotPresent)
      throw new Error(
        `The provided interaction->mousePosition did not match any nodes (${formatJsPath(
          mousePosition,
        )})`,
      );

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

  public async createMouseupTrigger(nodeId: number): Promise<{
    didTrigger: (mousePosition: IMousePosition, throwOnFail?: boolean) => Promise<IMouseUpResult>;
  }> {
    assert(nodeId, 'nodeId should not be null');
    const mouseListener = new MouseupListener(this.frameEnvironment, nodeId);
    await mouseListener.register();
    return {
      didTrigger: async (mousePosition, throwOnFail = true) => {
        const result = await mouseListener.didTriggerMouseEvent();
        if (!result.didClickLocation && throwOnFail) {
          this.throwMouseUpTriggerFailed(nodeId, result, mousePosition);
        }
        return result;
      },
    };
  }

  public async createMouseoverTrigger(
    nodeId: number,
  ): Promise<{ didTrigger: () => Promise<boolean> }> {
    assert(nodeId, 'nodeId should not be null');
    const mouseListener = new MouseoverListener(this.frameEnvironment, nodeId);
    await mouseListener.register();

    return {
      didTrigger: () => mouseListener.didTriggerMouseEvent(),
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

    switch (interaction.command) {
      case InteractionCommand.move: {
        const { x, y } = await this.getPositionXY(interaction.mousePosition);
        await this.mouse.move(x, y);
        break;
      }
      case InteractionCommand.scroll: {
        const windowBounds = await this.jsPath.getWindowOffset();
        const scroll = await this.getScrollOffset(interaction.mousePosition, windowBounds);

        if (scroll) {
          const { deltaY, deltaX } = scroll;
          await this.mouse.wheel(scroll);
          // need to check for offset since wheel event doesn't wait for scroll
          await this.jsPath.waitForScrollOffset(
            Math.max(0, deltaX + windowBounds.scrollX),
            Math.max(0, deltaY + windowBounds.scrollY),
          );
        }
        break;
      }

      case InteractionCommand.click:
      case InteractionCommand.doubleclick: {
        const { delayMillis, mouseButton, command, mousePosition } = interaction;
        if (!mousePosition) {
          throw new Error(
            `Null element provided to interact.click. Please double-check your selector`,
          );
        }
        const button = mouseButton || 'left';
        const clickCount = command === InteractionCommand.doubleclick ? 2 : 1;
        const isCoordinates = isMousePositionCoordinate(mousePosition);

        if (isCoordinates) {
          const [x, y] = mousePosition as number[];
          const clickOptions = { button, clickCount };
          await this.mouse.move(x, y);
          await this.mouse.down(clickOptions);
          if (delayMillis) await waitFor(delayMillis, resolvable);

          await this.mouse.up(clickOptions);
          return;
        }

        let nodePointerId: number;
        if (isMousePositionNodeId(mousePosition)) {
          nodePointerId = mousePosition[0] as number;
        } else {
          const nodeLookup = await this.jsPath.exec<number>(
            [...mousePosition, [getNodeIdFnName]],
            null,
          );
          if (nodeLookup.value) {
            nodePointerId = nodeLookup.value;
          }
        }

        const result = await this.moveMouseOverTarget(nodePointerId, interaction, resolvable);

        if (result.simulateOptionClick) {
          await this.jsPath.simulateOptionClick([nodePointerId]);
          return;
        }

        await this.mouse.down({ button, clickCount });
        if (delayMillis) await waitFor(delayMillis, resolvable);

        const mouseupTrigger = await this.createMouseupTrigger(nodePointerId);
        await this.mouse.up({ button, clickCount });
        await mouseupTrigger.didTrigger(mousePosition);
        break;
      }
      case InteractionCommand.clickUp: {
        const button = interaction.mouseButton || 'left';
        await this.mouse.up({ button });
        break;
      }
      case InteractionCommand.clickDown: {
        const button = interaction.mouseButton || 'left';
        await this.mouse.down({ button });
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
          } else if ('string' in keyboardCommand) {
            const text = keyboardCommand.string;
            for (const char of text) {
              if (char in KeyboardKeys) {
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

      case InteractionCommand.waitForNode: {
        await this.frameEnvironment.waitForDom(interaction.delayNode);
        break;
      }
      case InteractionCommand.waitForElementVisible: {
        await this.frameEnvironment.waitForDom(interaction.delayElement, { waitForVisible: true });
        break;
      }
      case InteractionCommand.waitForMillis: {
        await waitFor(interaction.delayMillis, resolvable);
        break;
      }
    }
  }

  private async getScrollOffset(
    targetPosition: IMousePosition,
    windowBounds: IWindowOffset,
  ): Promise<{ deltaX: number; deltaY: number }> {
    assert(targetPosition, 'targetPosition should not be null');

    if (isMousePositionCoordinate(targetPosition)) {
      const [x, y] = targetPosition as IMousePositionXY;
      const deltaX = x - windowBounds.scrollX;
      const deltaY = y - windowBounds.scrollY;
      return { deltaX, deltaY };
    }

    const rect = await this.lookupBoundingRect(targetPosition);

    const deltaY = deltaToFullyVisible(rect.y, rect.height, windowBounds.innerHeight);
    const deltaX = deltaToFullyVisible(rect.x, rect.width, windowBounds.innerWidth);

    if (deltaY === 0 && deltaX === 0) return null;
    return { deltaX, deltaY };
  }

  private async getPositionXY(
    mousePosition: IMousePosition,
  ): Promise<IPoint & { nodeId?: number }> {
    assert(mousePosition, 'mousePosition should not be null');
    if (isMousePositionCoordinate(mousePosition)) {
      const [x, y] = mousePosition as number[];
      return { x: round(x), y: round(y) };
    }
    const containerOffset = await this.frameEnvironment.getContainerOffset();
    const clientRectResult = await this.jsPath.exec<IElementRect>(
      [...mousePosition, [getClientRectFnName]],
      containerOffset,
    );
    const nodePointer = clientRectResult.nodePointer as INodePointer;

    const point = this.createPointInRect(clientRectResult.value);
    return { ...point, nodeId: nodePointer?.id };
  }

  private createPointInRect(rect: IElementRect): IPoint {
    if (rect.y === 0 && rect.height === 0 && rect.width === 0 && rect.x === 0) {
      return { x: 0, y: 0 };
    }
    // Default is to find exact middle. An emulator should replace an entry with a coordinate to avoid this functionality
    let x = round(rect.x + rect.width / 2);
    let y = round(rect.y + rect.height / 2);
    // if coordinates go out of screen, bring back
    if (x > this.viewport.width) x = this.viewport.width - 1;
    if (y > this.viewport.height) y = this.viewport.height - 1;

    return { x, y };
  }

  private async moveMouseOverTarget(
    nodeId: number,
    interaction: IInteractionStep,
    resolvable: IResolvablePromise,
  ): Promise<{ domCoordinates: IPoint; simulateOptionClick?: boolean }> {
    let targetPoint: IPoint;
    let nodeVisibility: INodeVisibility;
    // try 2x to hover over the expected target
    for (let retryNumber = 0; retryNumber < 2; retryNumber += 1) {
      const rect = await this.lookupBoundingRect([nodeId], false, true);

      if (rect.elementTag === 'option') {
        return { simulateOptionClick: true, domCoordinates: null };
      }
      nodeVisibility = rect.nodeVisibility;
      targetPoint = this.createPointInRect({
        tag: rect.elementTag,
        ...rect,
      });

      const needsMouseoverTest = !isPointInRect(this.mouse.position, rect);

      // wait for mouse to be over target
      const waitForTarget = needsMouseoverTest
        ? await this.createMouseoverTrigger(nodeId)
        : { didTrigger: () => Promise.resolve(true) };
      await this.mouse.move(targetPoint.x, targetPoint.y);

      const isOverTarget = await waitForTarget.didTrigger();
      if (isOverTarget === true) {
        return { domCoordinates: targetPoint };
      }

      this.logger.info(
        'Interaction.click - moving over target before click did not hover over expected "Interaction.mousePosition" element.',
        {
          mousePosition: interaction.mousePosition,
          expectedNodeId: nodeId,
          isNodeHidden: Object.values(rect.nodeVisibility ?? {}).some(Boolean),
          domCoordinates: targetPoint,
          retryNumber,
        },
      );

      // give the page time to sort out
      await waitFor(500, resolvable);
      // make sure element is on screen
      await this.playInteraction(resolvable, {
        command: 'scroll',
        mousePosition: [nodeId],
      });
    }

    this.logger.error(
      'Interaction.click - moving over target before click did not hover over expected "Interaction.mousePosition" element.',
      {
        'Interaction.mousePosition': interaction.mousePosition,
        target: {
          nodeId,
          nodeVisibility,
          domCoordinates: { x: targetPoint.x, y: targetPoint.y },
        },
      },
    );

    throw new Error(
      'Interaction.click - could not move mouse over target provided by "Interaction.mousePosition".',
    );
  }

  private throwMouseUpTriggerFailed(
    nodeId: number,
    mouseUpResult: IMouseUpResult,
    mousePosition: IMousePosition,
  ) {
    let extras = '';
    const isNodeHidden = mouseUpResult.expectedNodeVisibility.isVisible === false;
    if (isNodeHidden && nodeId) {
      extras = `\n\nNOTE: The target node is not visible in the dom.`;
    }
    if (this.preInteractionPaintStableStatus?.isStable === false) {
      if (!extras) extras += '\n\nNOTE:';
      extras += ` You might have more predictable results by waiting for the page to stabilize before triggering this click -- hero.waitForPaintingStable()`;
    }
    this.logger.error(
      `Interaction.click did not trigger mouseup on expected "Interaction.mousePosition" path.${extras}`,
      {
        'Interaction.mousePosition': mousePosition,
        expected: {
          nodeId,
          element: mouseUpResult.expectedNodePreview,
          visibility: mouseUpResult.expectedNodeVisibility,
        },
        clicked: {
          nodeId: mouseUpResult.targetNodeId,
          element: mouseUpResult.targetNodePreview,
          coordinates: {
            x: mouseUpResult.pageX,
            y: mouseUpResult.pageY,
          },
        },
      },
    );
    throw new Error(
      `Interaction.click did not trigger mouseup on expected "Interaction.mousePosition" path.${extras}`,
    );
  }

  private static injectScrollToPositions(interactions: IInteractionGroups): IInteractionGroups {
    const finalInteractions: IInteractionGroups = [];
    for (const group of interactions) {
      const groupCommands: IInteractionGroup = [];
      finalInteractions.push(groupCommands);
      for (const step of group) {
        if (
          commandsNeedingScroll.includes(InteractionCommand[step.command]) &&
          step.mousePosition
        ) {
          groupCommands.push({
            command: InteractionCommand.scroll,
            mousePosition: step.mousePosition,
          });
        }
        groupCommands.push(step);
      }
    }
    return finalInteractions;
  }
}

function isMousePositionNodeId(mousePosition: IMousePosition): boolean {
  return mousePosition.length === 1 && typeof mousePosition[0] === 'number';
}

export function isPointInRect(point: IPoint, rect: IRect): boolean {
  if (point.x < rect.x || point.x > rect.x + rect.width) return false;
  if (point.y < rect.y || point.y > rect.y + rect.height) return false;

  return true;
}

export function isMousePositionCoordinate(value: IMousePosition): boolean {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

export function deltaToFullyVisible(
  coordinate: number,
  length: number,
  boundaryLength: number,
): number {
  if (coordinate >= 0) {
    if (length > boundaryLength) {
      length = boundaryLength / 2;
    }
    const bottom = Math.round(coordinate + length);
    // end passes boundary
    if (bottom > boundaryLength) {
      return -Math.round(boundaryLength - bottom);
    }
  } else {
    const top = Math.round(coordinate);
    if (top < 0) {
      return top;
    }
  }
  return 0;
}

async function waitFor(millis: number, resolvable: IResolvablePromise): Promise<void> {
  if (millis === undefined || millis === null) return;

  await Promise.race([
    resolvable.promise,
    new Promise(resolve => setTimeout(resolve, millis).unref()),
  ]);
}

function round(num: number): number {
  return Math.round(10 * num) / 10;
}
