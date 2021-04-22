import {
  IInteractionGroup,
  IInteractionGroups,
  IInteractionStep,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
} from '@secret-agent/interfaces/IInteractions';
import { assert } from '@secret-agent/commons/utils';
import {
  getKeyboardKey,
  IKeyboardKey,
  KeyboardKeys,
} from '@secret-agent/interfaces/IKeyboardLayoutUS';
import IInteractionsHelper from '@secret-agent/interfaces/IInteractionsHelper';
import IRect from '@secret-agent/interfaces/IRect';
import IWindowOffset from '@secret-agent/interfaces/IWindowOffset';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import Log from '@secret-agent/commons/Logger';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import { IAttachedState } from '@secret-agent/interfaces/AwaitedDom';
import IPoint from '@secret-agent/interfaces/IPoint';
import IMouseUpResult from '@secret-agent/interfaces/IMouseUpResult';
import IResolvablePromise from '@secret-agent/interfaces/IResolvablePromise';
import { IPuppetKeyboard, IPuppetMouse } from '@secret-agent/interfaces/IPuppetInput';
import IHumanEmulator from '@secret-agent/interfaces/IHumanEmulator';
import IViewport from '@secret-agent/interfaces/IViewport';
import IElementRect from '@secret-agent/interfaces/IElementRect';
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
    return new JsPath(this.frameEnvironment).getWindowOffset().then(offset => {
      return {
        x: offset.pageXOffset,
        y: offset.pageYOffset,
      };
    });
  }

  public get viewport(): IViewport {
    return this.frameEnvironment.session.browserEmulator.configuration.viewport;
  }

  public logger: IBoundLog;

  private readonly frameEnvironment: FrameEnvironment;

  private get tab(): Tab {
    return this.frameEnvironment.tab;
  }

  private get mouse(): IPuppetMouse {
    return this.tab.puppetPage.mouse;
  }

  private get keyboard(): IPuppetKeyboard {
    return this.tab.puppetPage.keyboard;
  }

  private get humanEmulator(): IHumanEmulator {
    return this.tab.session.humanEmulator;
  }

  constructor(frameEnvironment: FrameEnvironment) {
    this.frameEnvironment = frameEnvironment;
    this.logger = log.createChild(module, {
      sessionId: frameEnvironment.session.id,
      frameId: frameEnvironment.id,
    });
  }

  public async initialize(): Promise<void> {
    if (this.humanEmulator.getStartingMousePoint) {
      this.mouse.position = await this.humanEmulator.getStartingMousePoint(this);
    }
  }

  public play(interactions: IInteractionGroups, resolvablePromise: IResolvablePromise<any>): void {
    const finalInteractions = Interactor.injectScrollToPositions(interactions);

    const humanEmulator = this.humanEmulator;
    humanEmulator
      .playInteractions(finalInteractions, this.playInteraction.bind(this, resolvablePromise), this)
      .then(resolvablePromise.resolve)
      .catch(resolvablePromise.reject);
  }

  public async lookupBoundingRect(
    mousePosition: IMousePosition,
    throwIfNotPresent = false,
  ): Promise<IRect & { elementTag?: string; nodeId?: number; isNodeVisible?: boolean }> {
    if (isMousePositionCoordinate(mousePosition)) {
      return {
        x: mousePosition[0] as number,
        y: mousePosition[1] as number,
        width: 1,
        height: 1,
      };
    }
    const jsPath = new JsPath(this.frameEnvironment, mousePosition);
    const rect = await jsPath.getClientRect();
    const attachedState = (rect as any).attachedState as IAttachedState;

    if (!attachedState && throwIfNotPresent)
      throw new Error(
        `The provided interaction->mousePosition did not match any nodes (${formatJsPath(
          mousePosition,
        )})`,
      );

    return {
      x: rect.left,
      y: rect.top,
      height: rect.height,
      width: rect.width,
      elementTag: rect.tag,
      nodeId: attachedState?.id,
      isNodeVisible: rect.isVisible,
    };
  }

  public async createMouseupTrigger(
    nodeId: number,
  ): Promise<{ didTrigger: () => Promise<IMouseUpResult> }> {
    assert(nodeId, 'nodeId should not be null');
    const mouseListener = new MouseupListener(this.frameEnvironment, nodeId);
    await mouseListener.register();
    return {
      didTrigger: () => mouseListener.didTriggerMouseEvent(),
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
        const windowBounds = await new JsPath(this.frameEnvironment).getWindowOffset();
        const scroll = await this.getScrollOffset(interaction.mousePosition, windowBounds);

        if (scroll) {
          const { deltaY, deltaX } = scroll;
          await this.mouse.wheel(scroll);
          // need to check for offset since wheel event doesn't wait for scroll
          await new JsPath(this.frameEnvironment).waitForScrollOffset(
            Math.max(0, deltaX + windowBounds.pageXOffset),
            Math.max(0, deltaY + windowBounds.pageYOffset),
          );
        }
        break;
      }

      case InteractionCommand.click:
      case InteractionCommand.doubleclick: {
        const { delayMillis, mouseButton, command, mousePosition } = interaction;
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

        let attachedNodeId: number;
        if (isMousePositionAttachedId(mousePosition)) {
          attachedNodeId = mousePosition[0] as number;
        } else {
          const attachedState = await new JsPath(
            this.frameEnvironment,
            mousePosition,
          ).getAttachedState();
          attachedNodeId = attachedState.attachedState.id;
        }

        const paintStableStatus = this.frameEnvironment.navigationsObserver.getPaintStableStatus();
        const result = await this.moveMouseOverTarget(attachedNodeId, interaction, resolvable);

        if (result.simulateOptionClick) {
          await new JsPath(this.frameEnvironment, [attachedNodeId]).simulateOptionClick();
          return;
        }

        const { domCoordinates } = result;

        await this.mouse.down({ button, clickCount });
        if (delayMillis) await waitFor(delayMillis, resolvable);

        const mouseupTrigger = await this.createMouseupTrigger(attachedNodeId);
        await this.mouse.up({ button, clickCount });
        const mouseupTriggered = await mouseupTrigger.didTrigger();
        if (!mouseupTriggered.didClickLocation) {
          const suggestWaitingMessage = paintStableStatus.isStable
            ? '\n\nYou might have more predictable results by waiting for the page to stabilize before triggering this click -- agent.waitForPaintingStable()'
            : '';
          this.logger.error(
            `Interaction.click did not trigger mouseup on the requested node.${suggestWaitingMessage}`,
            {
              interaction,
              jsPathNodeId: attachedNodeId,
              clickedNodeId: mouseupTriggered.targetNodeId,
              domCoordinates,
            },
          );
          throw new Error(
            `Interaction.click did not trigger mouseup on the desired node.${suggestWaitingMessage}`,
          );
        }
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
      const deltaX = x - windowBounds.pageXOffset;
      const deltaY = y - windowBounds.pageYOffset;
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
    const rect = await new JsPath(this.frameEnvironment, mousePosition).getClientRect();
    const attachedState = (rect as any).attachedState as IAttachedState;

    const point = this.createPointInRect(rect);
    return { ...point, nodeId: attachedState?.id };
  }

  private createPointInRect(rect: IElementRect): IPoint {
    if (rect.bottom === 0 && rect.height === 0 && rect.width === 0 && rect.right === 0) {
      return { x: 0, y: 0 };
    }
    // Default is to find exact middle. An emulator should replace an entry with a coordinate to avoid this functionality
    let x = round(rect.left + rect.width / 2);
    let y = round(rect.top + rect.height / 2);
    // if coordinates go out of screen, bring back
    if (x > this.viewport.width) x = this.viewport.width - 1;
    if (y > this.viewport.height) y = this.viewport.height - 1;

    return { x, y };
  }

  private async moveMouseOverTarget(
    attachedNodeId: number,
    interaction: IInteractionStep,
    resolvable: IResolvablePromise,
  ): Promise<{ domCoordinates: IPoint; simulateOptionClick?: boolean }> {
    // try 2x to hover over the expected target
    for (let retryNumber = 0; retryNumber < 2; retryNumber += 1) {
      const rect = await this.lookupBoundingRect([attachedNodeId], false);

      if (rect.elementTag === 'option') {
        return { simulateOptionClick: true, domCoordinates: null };
      }

      const targetPoint = this.createPointInRect({
        left: rect.x,
        top: rect.y,
        bottom: rect.y + rect.height,
        right: rect.x + rect.width,
        tag: rect.elementTag,
        ...rect,
      });

      const needsMouseoverTest = !isPointInRect(this.mouse.position, rect);

      // wait for mouse to be over target
      const waitForTarget = needsMouseoverTest
        ? await this.createMouseoverTrigger(attachedNodeId)
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
          expectedNodeId: attachedNodeId,
          domCoordinates: targetPoint,
          retryNumber,
        },
      );

      // give the page time to sort out
      await waitFor(500, resolvable);
      // make sure element is on screen
      await this.playInteraction(resolvable, {
        command: 'scroll',
        mousePosition: [attachedNodeId],
      });
    }

    throw new Error(
      'Interaction.click - could not move mouse over target provided by "Interaction.mousePosition".',
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

function isMousePositionAttachedId(mousePosition: IMousePosition): boolean {
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
    typeof value[0] === 'number'
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
