import {
  IInteractionGroups,
  IInteractionStep,
  IKeyboardCommand,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
} from '@secret-agent/core-interfaces/IInteractions';
import { HumanEmulatorClassDecorator } from '@secret-agent/core-interfaces/IHumanEmulatorClass';
import IRect from '@secret-agent/core-interfaces/IRect';
import IInteractionsHelper from '@secret-agent/core-interfaces/IInteractionsHelper';
import IPoint from '@secret-agent/core-interfaces/IPoint';
import IViewport from '@secret-agent/core-interfaces/IViewport';
import generateVector from './generateVector';

// ATTRIBUTION: heavily borrowed/inspired by https://github.com/Xetera/ghost-cursor

@HumanEmulatorClassDecorator
export default class HumanEmulatorGhost {
  public static id = 'ghost';

  public static overshootSpread = 2;
  public static overshootRadius = 5;
  public static overshootThreshold = 250;
  public static boxPaddingPercent = 33;
  public static maxScrollIncrement = 500;
  public static maxScrollDelayMillis = 15;
  public static maxDelayBetweenInteractions = 200;

  public static wordsPerMinuteRange = [30, 50];

  private millisPerCharacter: number;

  public async getStartingMousePoint(helper: IInteractionsHelper) {
    const viewport = helper.viewport;
    return getRandomRectPoint({
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  public async playInteractions(
    interactionGroups: IInteractionGroups,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ) {
    const millisPerCharacter = this.calculateMillisPerChar();

    for (let i = 0; i < interactionGroups.length; i += 1) {
      if (i > 0) {
        await delay(Math.random() * HumanEmulatorGhost.maxDelayBetweenInteractions);
      }
      for (const step of interactionGroups[i]) {
        if (step.command === InteractionCommand.scroll) {
          await this.scroll(step, run, helper);
          continue;
        }

        if (step.command === InteractionCommand.move) {
          await this.move(step, run, helper);
          continue;
        }

        if (
          step.command === InteractionCommand.click ||
          step.command === InteractionCommand.doubleclick
        ) {
          await this.moveAndClick(step, run, helper);
          continue;
        }

        if (step.command === InteractionCommand.type) {
          for (const keyboardCommand of step.keyboardCommands) {
            if ('string' in keyboardCommand) {
              for (const char of keyboardCommand.string) {
                await run(this.getKeyboardCommandWithDelay({ string: char }, millisPerCharacter));
              }
            } else {
              await run(this.getKeyboardCommandWithDelay(keyboardCommand, millisPerCharacter));
            }
          }
          continue;
        }

        await run(step);
      }
    }
  }

  protected async scroll(
    interactionStep: IInteractionStep,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ) {
    const scrollVector = await this.getScrollVector(interactionStep.mousePosition, helper);

    let counter = 0;
    for (const { x, y } of scrollVector) {
      await delay(Math.random() * HumanEmulatorGhost.maxScrollDelayMillis);

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

  protected async moveAndClick(
    interactionStep: IInteractionStep,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ) {
    interactionStep.delayMillis = Math.floor(Math.random() * 100);
    const targetRect = await helper.lookupBoundingRect(interactionStep.mousePosition);
    const targetPoint = getRandomRectPoint(targetRect, HumanEmulatorGhost.boxPaddingPercent);
    await this.moveToPoint(targetPoint, targetRect.width, run, helper);

    // if this is an option element, we have to do a specialized click, so let the Interactor handle
    if (targetRect.elementTag !== 'option') {
      interactionStep.mousePosition = [targetPoint.x, targetPoint.y];
    }
    await run(interactionStep);
  }

  protected async move(
    interactionStep: IInteractionStep,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ) {
    const rect = await helper.lookupBoundingRect(interactionStep.mousePosition);
    const targetPoint = getRandomRectPoint(rect, HumanEmulatorGhost.boxPaddingPercent);

    await this.moveToPoint(targetPoint, rect.width, run, helper);
  }

  protected async moveToPoint(
    targetPoint: IPoint,
    targetWidth: number,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ) {
    const mousePosition = helper.mousePosition;
    const vector = generateVector(mousePosition, targetPoint, targetWidth, {
      threshold: HumanEmulatorGhost.overshootThreshold,
      radius: HumanEmulatorGhost.overshootRadius,
      spread: HumanEmulatorGhost.overshootSpread,
    });

    for (const { x, y } of vector) {
      await run({
        mousePosition: [x, y],
        command: InteractionCommand.move,
      });
    }
  }

  protected async jitterMouse(
    helper: IInteractionsHelper,
    run: (interactionStep: IInteractionStep) => Promise<void>,
  ) {
    const mousePosition = helper.mousePosition;
    const jitterX = Math.max(mousePosition.x + Math.round(getRandomPositiveOrNegativeNumber()), 0);
    const jitterY = Math.max(mousePosition.y + Math.round(getRandomPositiveOrNegativeNumber()), 0);
    if (jitterX !== mousePosition.x || jitterY !== mousePosition.y) {
      // jitter mouse
      await run({
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

  protected calculateMillisPerChar() {
    if (!this.millisPerCharacter) {
      const wpmRange =
        HumanEmulatorGhost.wordsPerMinuteRange[1] - HumanEmulatorGhost.wordsPerMinuteRange[0];
      const wpm = Math.floor(Math.random() * wpmRange) + HumanEmulatorGhost.wordsPerMinuteRange[0];

      const averageWordLength = 5;
      const charsPerSecond = (wpm * averageWordLength) / 60;
      this.millisPerCharacter = Math.round(1000 / charsPerSecond);
    }
    return this.millisPerCharacter;
  }

  private async getScrollVector(mousePosition: IMousePosition, helper: IInteractionsHelper) {
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
      threshold: HumanEmulatorGhost.overshootThreshold,
      radius: HumanEmulatorGhost.overshootRadius,
      spread: HumanEmulatorGhost.overshootSpread,
    });

    const points = [];
    for (let point of scrollVector) {
      // convert points into deltas from previous scroll point
      const scrollX = shouldScrollX ? Math.round(point.x) : startScrollOffset.x;
      const scrollY = shouldScrollY ? Math.round(point.y) : startScrollOffset.y;
      if (scrollY === lastPoint.y && scrollX === lastPoint.x) continue;

      point = {
        x: scrollX,
        y: scrollY,
      };
      const newPoints: IPoint[] = [point];

      const scrollYPixels = Math.abs(scrollY - lastPoint.y);
      // if too big a jump, backfill smaller jumps
      if (scrollYPixels > HumanEmulatorGhost.maxScrollIncrement) {
        const isNegative = scrollY < lastPoint.y;
        const chunks = splitIntoMaxLengthSegments(
          scrollYPixels,
          HumanEmulatorGhost.maxScrollIncrement,
        );
        for (const chunk of chunks) {
          const deltaY = isNegative ? -chunk : chunk;
          if (deltaY === 0) continue;
          newPoints.unshift({
            x: scrollX,
            y: newPoints[0].y - deltaY,
          });
        }
      }

      const lastEntry = points[points.length - 1];
      // if same point added, yank it now
      if (lastEntry && lastEntry.x === newPoints[0].x && lastEntry.y === newPoints[0].y) {
        newPoints.shift();
      }
      points.push(...newPoints);

      lastPoint = point;
    }
    if (lastPoint.y !== scrollToPoint.y || lastPoint.x !== scrollToPoint.x) {
      points.push(scrollToPoint);
    }
    return points;
  }
}

export function isVisible(coordinate: number, length: number, boundaryLength: number) {
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

async function delay(millis: number) {
  if (!millis) return;
  await new Promise<void>(resolve => setTimeout(resolve, Math.floor(millis)));
}

function splitIntoMaxLengthSegments(total: number, maxValue: number) {
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

function getRandomPositiveOrNegativeNumber() {
  const negativeMultiplier = Math.random() < 0.5 ? -1 : 1;

  return Math.random() * negativeMultiplier;
}

function getScrollRectPoint(targetRect: IRect, viewport: IViewport) {
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
