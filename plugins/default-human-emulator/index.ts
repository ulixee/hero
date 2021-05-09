import {
  IInteractionGroups,
  IInteractionStep,
  IKeyboardCommand,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
} from '@secret-agent/interfaces/IInteractions';
import { HumanEmulatorClassDecorator } from '@secret-agent/interfaces/IPluginHumanEmulator';
import IRect from '@secret-agent/interfaces/IRect';
import IInteractionsHelper from '@secret-agent/interfaces/IInteractionsHelper';
import IPoint from '@secret-agent/interfaces/IPoint';
import IViewport from '@secret-agent/interfaces/IViewport';
import type IMouseUpResult from '@secret-agent/interfaces/IMouseUpResult';
import HumanEmulatorBase from '@secret-agent/plugin-utils/lib/HumanEmulatorBase';
import generateVector from './generateVector';
import * as pkg from './package.json';

// ATTRIBUTION: heavily borrowed/inspired by https://github.com/Xetera/ghost-cursor

let startStamp;

@HumanEmulatorClassDecorator
export default class DefaultHumanEmulator extends HumanEmulatorBase {
  public static id = pkg.name.replace('@secret-agent/', '');

  public static overshootSpread = 2;
  public static overshootRadius = 5;
  public static overshootThreshold = 250;
  public static boxPaddingPercent = 33;
  public static maxScrollIncrement = 500;
  public static maxScrollDelayMillis = 15;
  public static maxDelayBetweenInteractions = 200;

  public static wordsPerMinuteRange = [30, 50];

  private millisPerCharacter: number;

  constructor(options) {
    super(options);
    startStamp = Date.now();
  }

  public getStartingMousePoint(helper: IInteractionsHelper): Promise<IPoint> {
    const viewport = helper.viewport;
    return Promise.resolve(
      getRandomRectPoint({
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      }),
    );
  }

  public async playInteractions(
    interactionGroups: IInteractionGroups,
    runFn: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<void> {
    const millisPerCharacter = this.calculateMillisPerChar();

    console.log('TIMESTAMP: ', Date.now() - startStamp);
    for (let i = 0; i < interactionGroups.length; i += 1) {
      if (i > 0) {
        const millis = Math.random() * DefaultHumanEmulator.maxDelayBetweenInteractions;
        console.log('TIMESTAMP - delay ', millis);
        await delay(millis);
      }
      for (const step of interactionGroups[i]) {
        if (step.command === InteractionCommand.scroll) {
          console.log('TIMESTAMP - scroll ', Date.now() - startStamp);
          await this.scroll(step, runFn, helper);
          continue;
        }

        if (step.command === InteractionCommand.move) {
          console.log('TIMESTAMP - moveMouse ', Date.now() - startStamp);
          await this.moveMouse(step, runFn, helper);
          continue;
        }

        if (
          step.command === InteractionCommand.click ||
          step.command === InteractionCommand.doubleclick
        ) {
          console.log('TIMESTAMP - moveMouseAndClick ', Date.now() - startStamp);
          try {
            console.log('------------------');
            await this.moveMouseAndClick(step, runFn, helper);
          } catch (error) {
            console.log('TIMESTAMP - ERROR ', Date.now() - startStamp);
            throw error;
          }
          continue;
        }

        if (step.command === InteractionCommand.type) {
          for (const keyboardCommand of step.keyboardCommands) {
            if ('string' in keyboardCommand) {
              for (const char of keyboardCommand.string) {
                console.log('TIMESTAMP - getKeyboardCommandWithDelay ', Date.now() - startStamp);
                await runFn(this.getKeyboardCommandWithDelay({ string: char }, millisPerCharacter));
              }
            } else {
              console.log('TIMESTAMP - getKeyboardCommandWithDelay ', Date.now() - startStamp);
              await runFn(this.getKeyboardCommandWithDelay(keyboardCommand, millisPerCharacter));
            }
          }
          continue;
        }

        console.log('TIMESTAMP - runFn ', Date.now() - startStamp);
        await runFn(step);
      }
    }
  }

  protected async scroll(
    interactionStep: IInteractionStep,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<void> {
    const scrollVector = await this.getScrollVector(interactionStep.mousePosition, helper);

    let counter = 0;
    for (const { x, y } of scrollVector) {
      await delay(Math.random() * DefaultHumanEmulator.maxScrollDelayMillis);

      const shouldAddMouseJitter = counter % Math.round(Math.random() * 6) === 0;
      if (shouldAddMouseJitter) {
        await this.jitterMouse(helper, run);
      }

      await run({
        mousePosition: [x, y],
        command: InteractionCommand.scroll,
      });
      counter += 1;
    }
  }

  protected async moveMouseAndClick(
    interactionStep: IInteractionStep,
    runFn: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
    nodeId?: number,
    retries = 0,
  ): Promise<void> {
    const originalMousePosition = [...interactionStep.mousePosition];
    interactionStep.delayMillis = Math.floor(Math.random() * 100);

    console.log('TIMESTAMP - lookupBoundingRect ', Date.now() - startStamp);
    const targetRect = await helper.lookupBoundingRect(
      nodeId ? [nodeId] : interactionStep.mousePosition,
      true,
    );

    const targetPoint = getRandomRectPoint(targetRect, DefaultHumanEmulator.boxPaddingPercent);
    console.log('TIMESTAMP - moveMouseToPoint ', Date.now() - startStamp);
    const didMoveMouse = await this.moveMouseToPoint(targetPoint, targetRect.width, runFn, helper);
    console.log('TIMESTAMP - lookupBoundingRect ', Date.now() - startStamp);
    const finalRect = didMoveMouse
      ? await helper.lookupBoundingRect([targetRect.nodeId], true, true)
      : targetRect;

    const isFinalRectVisible = this.isRectVisible(finalRect, helper);
    // make sure target is still visible
    if (!isFinalRectVisible || !isWithinRect(targetPoint, finalRect)) {
      // need to try again
      if (retries < 2) {
        const isScroll = !isFinalRectVisible;
        helper.logger.info(
          `Click mousePosition not in viewport after mouse moves. Moving${
            isScroll ? ' and scrolling' : ''
          } to a new point.`,
          {
            interactionStep,
            nodeId: targetRect.nodeId,
            nodeVisibility: finalRect.nodeVisibility,
            retries,
          },
        );
        if (isScroll) {
          const scrollToStep = interactionStep;
          if (targetRect.nodeId) scrollToStep.mousePosition = [targetRect.nodeId];
          console.log('TIMESTAMP - scroll ', Date.now() - startStamp);
          await this.scroll(scrollToStep, runFn, helper);
        }
        return this.moveMouseAndClick(interactionStep, runFn, helper, targetRect.nodeId, retries + 1);
      }
      throw new Error(
        'Element or mousePosition remains out of viewport after 2 attempts to move it into view',
      );
    }

    let clickConfirm: (
      mousePosition: IMousePosition,
      throwOnFail: boolean,
    ) => Promise<IMouseUpResult> = null;
    if (targetRect.nodeId && targetRect.elementTag !== 'option') {
      console.log('TIMESTAMP - createMouseupTrigger ', Date.now() - startStamp);
      const listener = await helper.createMouseupTrigger(targetRect.nodeId);
      clickConfirm = listener.didTrigger;
    }

    if (targetRect.elementTag !== 'option') {
      // if this is an option element, we have to do a specialized click, so let the Interactor handle
      interactionStep.mousePosition = [targetPoint.x, targetPoint.y];
    }

    console.log('TIMESTAMP - runFn ', Date.now() - startStamp);
    await runFn(interactionStep);

    if (clickConfirm !== null) {
      await clickConfirm(originalMousePosition, true);
    }
  }

  protected async moveMouse(
    interactionStep: IInteractionStep,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<void> {
    const rect = await helper.lookupBoundingRect(interactionStep.mousePosition);
    const targetPoint = getRandomRectPoint(rect, DefaultHumanEmulator.boxPaddingPercent);

    await this.moveMouseToPoint(targetPoint, rect.width, run, helper);
  }

  protected async moveMouseToPoint(
    targetPoint: IPoint,
    targetWidth: number,
    runFn: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<boolean> {
    const mousePosition = helper.mousePosition;
    const vector = generateVector(mousePosition, targetPoint, targetWidth, {
      threshold: DefaultHumanEmulator.overshootThreshold,
      radius: DefaultHumanEmulator.overshootRadius,
      spread: DefaultHumanEmulator.overshootSpread,
    });

    if (!vector.length) return false;
    let i = 0;
    console.log('VECTORS = ', vector.length);
    for (const { x, y } of vector) {
      i += 1;
      console.log(`TIMESTAMP - VECTOR ${i}`, Date.now() - startStamp, { x, y });
      await runFn({
        mousePosition: [x, y],
        command: InteractionCommand.move,
      });
    }
    return true;
  }

  protected async jitterMouse(
    helper: IInteractionsHelper,
    runFn: (interactionStep: IInteractionStep) => Promise<void>,
  ): Promise<void> {
    const mousePosition = helper.mousePosition;
    const jitterX = Math.max(mousePosition.x + Math.round(getRandomPositiveOrNegativeNumber()), 0);
    const jitterY = Math.max(mousePosition.y + Math.round(getRandomPositiveOrNegativeNumber()), 0);
    if (jitterX !== mousePosition.x || jitterY !== mousePosition.y) {
      // jitter mouse
      await runFn({
        mousePosition: [jitterX, jitterY],
        command: InteractionCommand.move,
      });
    }
  }

  /////// KEYBOARD /////////////////////////////////////////////////////////////////////////////////////////////////////

  protected getKeyboardCommandWithDelay(keyboardCommand: IKeyboardCommand, millisPerChar: number) {
    const randomFactor = getRandomPositiveOrNegativeNumber() * (millisPerChar / 2);
    const delayMillis = Math.floor(randomFactor + millisPerChar);
    const keyboardKeyupDelay = Math.max(Math.ceil(Math.random() * 60), 10);
    return {
      command: InteractionCommand.type,
      keyboardCommands: [keyboardCommand],
      keyboardDelayBetween: delayMillis - keyboardKeyupDelay,
      keyboardKeyupDelay,
    };
  }

  protected calculateMillisPerChar(): number {
    if (!this.millisPerCharacter) {
      const wpmRange =
        DefaultHumanEmulator.wordsPerMinuteRange[1] - DefaultHumanEmulator.wordsPerMinuteRange[0];
      const wpm =
        Math.floor(Math.random() * wpmRange) + DefaultHumanEmulator.wordsPerMinuteRange[0];

      const averageWordLength = 5;
      const charsPerSecond = (wpm * averageWordLength) / 60;
      this.millisPerCharacter = Math.round(1000 / charsPerSecond);
    }
    return this.millisPerCharacter;
  }

  private async getScrollVector(
    mousePosition: IMousePosition,
    helper: IInteractionsHelper,
  ): Promise<IPoint[]> {
    const isCoordinates =
      typeof mousePosition[0] === 'number' && typeof mousePosition[1] === 'number';
    let shouldScrollX: boolean;
    let shouldScrollY: boolean;
    let scrollToPoint: IPoint;
    const startScrollOffset = await helper.scrollOffset;

    if (!isCoordinates) {
      const targetRect = await helper.lookupBoundingRect(mousePosition);
      // figure out if target is in view
      const viewport = helper.viewport;
      shouldScrollY = isVisible(targetRect.y, targetRect.height, viewport.height) === false;
      shouldScrollX = isVisible(targetRect.x, targetRect.width, viewport.width) === false;

      // positions are all relative to viewport, so act like we're at 0,0
      scrollToPoint = getScrollRectPoint(targetRect, viewport);

      if (shouldScrollY) scrollToPoint.y += startScrollOffset.y;
      else scrollToPoint.y = startScrollOffset.y;

      if (shouldScrollX) scrollToPoint.x += startScrollOffset.x;
      else scrollToPoint.x = startScrollOffset.x;
    } else {
      const [x, y] = mousePosition as IMousePositionXY;
      scrollToPoint = { x, y };
      shouldScrollY = y !== startScrollOffset.y;
      shouldScrollX = x !== startScrollOffset.x;
    }

    if (!shouldScrollY && !shouldScrollX) return [];

    let lastPoint: IPoint = startScrollOffset;
    const scrollVector = generateVector(startScrollOffset, scrollToPoint, 200, {
      threshold: DefaultHumanEmulator.overshootThreshold,
      radius: DefaultHumanEmulator.overshootRadius,
      spread: DefaultHumanEmulator.overshootSpread,
    });

    const points: IPoint[] = [];
    for (let point of scrollVector) {
      // convert points into deltas from previous scroll point
      const scrollX = shouldScrollX ? Math.round(point.x) : startScrollOffset.x;
      const scrollY = shouldScrollY ? Math.round(point.y) : startScrollOffset.y;
      if (scrollY === lastPoint.y && scrollX === lastPoint.x) continue;
      if (scrollY < 0 || scrollX < 0) continue;

      point = {
        x: scrollX,
        y: scrollY,
      };

      const scrollYPixels = Math.abs(scrollY - lastPoint.y);
      // if too big a jump, backfill smaller jumps
      if (scrollYPixels > DefaultHumanEmulator.maxScrollIncrement) {
        const isNegative = scrollY < lastPoint.y;
        const chunks = splitIntoMaxLengthSegments(
          scrollYPixels,
          DefaultHumanEmulator.maxScrollIncrement,
        );
        for (const chunk of chunks) {
          const deltaY = isNegative ? -chunk : chunk;
          const scrollYChunk = Math.max(lastPoint.y + deltaY, 0);
          if (scrollYChunk === lastPoint.y) continue;

          const newPoint = {
            x: scrollX,
            y: scrollYChunk,
          };
          points.push(newPoint);
          lastPoint = newPoint;
        }
      }

      const lastEntry = points[points.length - 1];
      // if same point added, yank it now
      if (!lastEntry || lastEntry.x !== point.x || lastEntry.y !== point.y) {
        points.push(point);
        lastPoint = point;
      }
    }
    if (lastPoint.y !== scrollToPoint.y || lastPoint.x !== scrollToPoint.x) {
      points.push(scrollToPoint);
    }
    return points;
  }

  private isRectVisible(rect: IRect, helper: IInteractionsHelper): boolean {
    const viewport = helper.viewport;
    return (
      isVisible(rect.y, rect.height, viewport.height) &&
      isVisible(rect.x, rect.width, viewport.width)
    );
  }
}

function isWithinRect(targetPoint: IPoint, finalRect: IRect): boolean {
  if (targetPoint.x < finalRect.x || targetPoint.x > finalRect.x + finalRect.width) return false;
  if (targetPoint.y < finalRect.y || targetPoint.y > finalRect.y + finalRect.height) return false;

  return true;
}

export function isVisible(coordinate: number, length: number, boundaryLength: number): boolean {
  if (length > boundaryLength) {
    length = boundaryLength;
  }
  const midpointOffset = Math.round(coordinate + length / 2);
  if (coordinate >= 0) {
    // midpoint passes end
    if (midpointOffset >= boundaryLength) {
      return false;
    }
  } else {
    // midpoint before start
    // eslint-disable-next-line no-lonely-if
    if (midpointOffset <= 0) {
      return false;
    }
  }
  return true;
}

async function delay(millis: number): Promise<void> {
  if (!millis) return;
  await new Promise<void>(resolve => setTimeout(resolve, Math.floor(millis)));
}

function splitIntoMaxLengthSegments(total: number, maxValue: number): number[] {
  const values: number[] = [];
  let currentSum = 0;
  while (currentSum < total) {
    let nextValue = Math.round(Math.random() * maxValue * 10) / 10;
    if (currentSum + nextValue > total) {
      nextValue = total - currentSum;
    }
    currentSum += nextValue;
    values.push(nextValue);
  }
  return values;
}

function getRandomPositiveOrNegativeNumber(): number {
  const negativeMultiplier = Math.random() < 0.5 ? -1 : 1;

  return Math.random() * negativeMultiplier;
}

function getScrollRectPoint(targetRect: IRect, viewport: IViewport): IPoint {
  let { y, x } = targetRect;
  const fudge = 2 * Math.random();
  // target rect inside bounds
  const midViewportHeight = Math.round(viewport.height / 2 + fudge);
  const midViewportWidth = Math.round(viewport.width / 2 + fudge);

  if (y < -(midViewportHeight + 1)) y -= midViewportHeight;
  else if (y > midViewportHeight + 1) y -= midViewportHeight;

  if (x < -(midViewportWidth + 1)) x -= midViewportWidth;
  else if (x > midViewportWidth + 1) x -= midViewportWidth;

  x = Math.round(x * 10) / 10;
  y = Math.round(y * 10) / 10;

  return { x, y };
}

function getRandomRectPoint(targetRect: IRect, paddingPercent?: number): IPoint {
  const { y, x, height, width } = targetRect;

  let paddingWidth = 0;
  let paddingHeight = 0;

  if (paddingPercent !== undefined && paddingPercent > 0 && paddingPercent < 100) {
    paddingWidth = (width * paddingPercent) / 100;
    paddingHeight = (height * paddingPercent) / 100;
  }

  return {
    x: Math.round(x + paddingWidth / 2 + Math.random() * (width - paddingWidth)),
    y: Math.round(y + paddingHeight / 2 + Math.random() * (height - paddingHeight)),
  };
}
