import {
  IInteractionGroups,
  IInteractionStep,
  IKeyboardCommand,
  IMousePosition,
  IMousePositionXY,
  InteractionCommand,
  isMousePositionXY,
} from '@ulixee/hero-interfaces/IInteractions';
import { HumanEmulatorClassDecorator } from '@ulixee/hero-interfaces/ICorePlugin';
import IInteractionsHelper, { IRectLookup } from '@ulixee/hero-interfaces/IInteractionsHelper';
import IPoint from '@ulixee/hero-interfaces/IPoint';
import HumanEmulator from '@ulixee/hero-plugin-utils/lib/HumanEmulator';
import generateVector from './generateVector';
import * as pkg from './package.json';
import IMouseUpResult from '@ulixee/hero-interfaces/IMouseUpResult';

// ATTRIBUTION: heavily borrowed/inspired by https://github.com/Xetera/ghost-cursor

@HumanEmulatorClassDecorator
export default class DefaultHumanEmulator extends HumanEmulator {
  public static id = pkg.name.replace('@ulixee/', '');

  public static overshootSpread = 2;
  public static overshootRadius = 5;
  public static overshootThreshold = 250;
  public static boxPaddingPercent = { width: 33, height: 33 };
  public static minimumMoveSteps = 5;
  public static minimumScrollSteps = 10;
  public static maxScrollIncrement = 500;
  public static maxScrollDelayMillis = 15;
  public static maxDelayBetweenInteractions = 200;

  public static wordsPerMinuteRange = [30, 50];

  private millisPerCharacter: number;

  public getStartingMousePoint(helper: IInteractionsHelper): Promise<IPoint> {
    const viewport = helper.viewportSize;
    return Promise.resolve(
      helper.createPointInRect({
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
    for (let i = 0; i < interactionGroups.length; i += 1) {
      if (i > 0) {
        const millis = Math.random() * DefaultHumanEmulator.maxDelayBetweenInteractions;
        await delay(millis);
      }
      for (const step of interactionGroups[i]) {
        if (step.command === InteractionCommand.scroll) {
          await this.scroll(step, runFn, helper);
          continue;
        }

        if (step.command === InteractionCommand.move) {
          await this.moveMouse(step, runFn, helper);
          continue;
        }

        if (
          step.command === InteractionCommand.click ||
          step.command === InteractionCommand.clickUp ||
          step.command === InteractionCommand.clickDown ||
          step.command === InteractionCommand.doubleclick
        ) {
          await this.moveMouseAndClick(step, runFn, helper);
          continue;
        }

        if (step.command === InteractionCommand.type) {
          for (const keyboardCommand of step.keyboardCommands) {
            const millisPerCharacter = this.calculateMillisPerChar();

            if ('string' in keyboardCommand) {
              for (const char of keyboardCommand.string) {
                await runFn(this.getKeyboardCommandWithDelay({ string: char }, millisPerCharacter));
              }
            } else {
              await runFn(this.getKeyboardCommandWithDelay(keyboardCommand, millisPerCharacter));
            }
          }
          continue;
        }

        if (step.command === InteractionCommand.willDismissDialog) {
          const millis = Math.random() * DefaultHumanEmulator.maxDelayBetweenInteractions;
          await delay(millis);
          continue;
        }

        await runFn(step);
      }
    }
  }

  protected async scroll(
    interactionStep: IInteractionStep,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<void> {
    const scrollVector = await this.getScrollVector(interactionStep, helper);

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
  ): Promise<void> {
    const { mousePosition, command, relativeToScrollOffset } = interactionStep;
    interactionStep.delayMillis ??= Math.floor(Math.random() * 100);
    delete interactionStep.relativeToScrollOffset;

    const originalMousePosition = [...interactionStep.mousePosition];

    const retries = 3;

    for (let i = 0; i < retries; i += 1) {
      const targetRect = await helper.lookupBoundingRect(mousePosition, {
        relativeToScrollOffset,
        includeNodeVisibility: true,
        useLastKnownPosition: interactionStep.verification === 'none',
      });

      if (targetRect.elementTag === 'option') {
        // options need a browser level call
        interactionStep.simulateOptionClickOnNodeId = targetRect.nodeId;
        interactionStep.verification = 'none';
      }

      if (targetRect.nodeVisibility?.isVisible === false) {
        interactionStep.mousePosition = await this.resolveMoveAndClickForInvisibleNode(
          interactionStep,
          runFn,
          helper,
          targetRect,
        );

        if (!interactionStep.simulateOptionClickOnNodeId) {
          continue;
        }
      }

      const targetPoint = helper.createPointInRect(targetRect, {
        paddingPercent: DefaultHumanEmulator.boxPaddingPercent,
      });
      await this.moveMouseToPoint(interactionStep, runFn, helper, targetPoint, targetRect.width);

      let clickConfirm: () => Promise<IMouseUpResult>;
      if (
        targetRect.nodeId &&
        command !== InteractionCommand.clickDown &&
        interactionStep.verification !== 'none'
      ) {
        const listener = await helper.createMouseupTrigger(targetRect.nodeId);
        if (listener.nodeVisibility.isVisible === false) {
          targetRect.nodeVisibility = listener.nodeVisibility;
          interactionStep.mousePosition = await this.resolveMoveAndClickForInvisibleNode(
            interactionStep,
            runFn,
            helper,
            targetRect,
          );
          continue;
        }
        clickConfirm = listener.didTrigger;
      }

      interactionStep.mousePosition = [targetPoint.x, targetPoint.y];
      await runFn(interactionStep);
      if (clickConfirm) {
        const mouseUpResult = await clickConfirm();

        if (!mouseUpResult.didClickLocation) {
          this.logMouseupClickFailure(
            mouseUpResult,
            helper,
            originalMousePosition,
            targetRect.nodeId,
          );
        }
      }
      return;
    }

    throw new Error(
      `"Interaction.${interactionStep.command}" element invisible after ${retries} attempts to move it into view.`,
    );
  }

  protected logMouseupClickFailure(
    mouseUpResult: IMouseUpResult,
    helper: IInteractionsHelper,
    originalMousePosition: IMousePosition,
    nodeId: number,
  ): void {
    let extras = '';
    const isNodeHidden = mouseUpResult.expectedNodeVisibility.isVisible === false;
    if (isNodeHidden) {
      extras = `\n\nNOTE: The target node is not visible in the dom.`;
    }
    if (mouseUpResult.didStartInteractWithPaintingStable === false) {
      if (!extras) extras += '\n\nNOTE:';
      extras += ` You might have more predictable results by waiting for the page to stabilize before triggering this click -- hero.waitForPaintingStable()`;
    }
    helper.logger.error(
      `Interaction.click did not trigger mouseup on expected "Interaction.mousePosition" path.${extras}`,
      {
        'Interaction.mousePosition': originalMousePosition,
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

  protected async moveMouse(
    interactionStep: IInteractionStep,
    run: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
  ): Promise<IPoint> {
    const rect = await helper.lookupBoundingRect(interactionStep.mousePosition, {
      relativeToScrollOffset: interactionStep.relativeToScrollOffset,
      useLastKnownPosition: interactionStep.verification === 'none',
    });
    const targetPoint = helper.createPointInRect(rect, {
      paddingPercent: DefaultHumanEmulator.boxPaddingPercent,
    });

    await this.moveMouseToPoint(interactionStep, run, helper, targetPoint, rect.width);
    return targetPoint;
  }

  protected async moveMouseToPoint(
    interactionStep: IInteractionStep,
    runFn: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
    targetPoint: IPoint,
    targetWidth: number,
  ): Promise<boolean> {
    const mousePosition = helper.mousePosition;

    const vector = generateVector(
      mousePosition,
      targetPoint,
      targetWidth,
      DefaultHumanEmulator.minimumMoveSteps,
      {
        threshold: DefaultHumanEmulator.overshootThreshold,
        radius: DefaultHumanEmulator.overshootRadius,
        spread: DefaultHumanEmulator.overshootSpread,
      },
    );

    if (!vector.length) return false;
    for (const { x, y } of vector) {
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
    interactionStep: IInteractionStep,
    helper: IInteractionsHelper,
  ): Promise<IPoint[]> {
    let shouldScrollX: boolean;
    let shouldScrollY: boolean;
    let scrollToPoint: IPoint;
    const currentScrollOffset = await helper.scrollOffset;

    const { mousePosition, relativeToScrollOffset, verification } = interactionStep;
    if (isMousePositionXY(mousePosition)) {
      const [x, y] = mousePosition as IMousePositionXY;
      scrollToPoint = { x, y };
      if (relativeToScrollOffset) {
        scrollToPoint.y = scrollToPoint.y + relativeToScrollOffset.y - currentScrollOffset.y;
        scrollToPoint.x = scrollToPoint.x + relativeToScrollOffset.x - currentScrollOffset.x;
      }
      shouldScrollY = scrollToPoint.y !== currentScrollOffset.y;
      shouldScrollX = scrollToPoint.x !== currentScrollOffset.x;
    } else {
      const targetRect = await helper.lookupBoundingRect(mousePosition, {
        useLastKnownPosition: verification === 'none',
      });
      // figure out if target is in view
      const viewportSize = helper.viewportSize;
      const isRectVisible = helper.isRectInViewport(targetRect, viewportSize, 50);
      shouldScrollY = !isRectVisible.height;
      shouldScrollX = !isRectVisible.width;

      scrollToPoint = helper.createScrollPointForRect(targetRect, viewportSize);

      // positions are all relative to viewport, so normalize based on the current offsets
      if (shouldScrollY) scrollToPoint.y += currentScrollOffset.y;
      else scrollToPoint.y = currentScrollOffset.y;

      if (shouldScrollX) scrollToPoint.x += currentScrollOffset.x;
      else scrollToPoint.x = currentScrollOffset.x;
    }

    if (!shouldScrollY && !shouldScrollX) return [];

    let lastPoint: IPoint = currentScrollOffset;
    const scrollVector = generateVector(
      currentScrollOffset,
      scrollToPoint,
      200,
      DefaultHumanEmulator.minimumScrollSteps,
      {
        threshold: DefaultHumanEmulator.overshootThreshold,
        radius: DefaultHumanEmulator.overshootRadius,
        spread: DefaultHumanEmulator.overshootSpread,
      },
    );

    const points: IPoint[] = [];
    for (let point of scrollVector) {
      // convert points into deltas from previous scroll point
      const scrollX = shouldScrollX ? Math.round(point.x) : currentScrollOffset.x;
      const scrollY = shouldScrollY ? Math.round(point.y) : currentScrollOffset.y;
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

  private async resolveMoveAndClickForInvisibleNode(
    interactionStep: IInteractionStep,
    runFn: (interactionStep: IInteractionStep) => Promise<void>,
    helper: IInteractionsHelper,
    targetRect: IRectLookup,
  ): Promise<IMousePosition> {
    const { nodeVisibility } = targetRect;
    const viewport = helper.viewportSize;

    const interactionName = `"Interaction.${interactionStep.command}"`;
    const { hasDimensions, isConnected, nodeExists } = nodeVisibility;
    helper.logger.warn(`${interactionName} element not visible.`, {
      interactionStep,
      target: targetRect,
      viewport,
    });

    if (!nodeExists) throw new Error(`${interactionName} element does not exist.`);

    // if node is not connected, we need to pick our strategy
    if (!isConnected) {
      const { verification } = interactionStep;
      if (verification === 'elementAtPath') {
        const nodePointer = await helper.reloadJsPath(interactionStep.mousePosition);
        helper.logger.warn(`${interactionName} - checking for new element matching query.`, {
          interactionStep,
          nodePointer,
          didFindUpdatedPath: nodePointer.id !== targetRect.nodeId,
        });
        if (nodePointer.id !== targetRect.nodeId) {
          return [nodePointer.id];
        }
      }

      throw new Error(`${interactionName} element isn't connected to the DOM.`);
    }

    const isOffscreen = !nodeVisibility.isOnscreenVertical || !nodeVisibility.isOnscreenHorizontal;
    if (hasDimensions && isOffscreen) {
      await this.scroll(interactionStep, runFn, helper);
      return interactionStep.mousePosition;
    }

    if (hasDimensions && !!nodeVisibility.obstructedByElementRect) {
      const { obstructedByElementRect } = nodeVisibility;
      if (obstructedByElementRect.tag === 'html' && targetRect.elementTag === 'option') {
        return interactionStep.mousePosition;
      }

      if (obstructedByElementRect.height >= viewport.height)
        throw new Error(`${interactionName} element is obstructed by a full screen element`);

      const maxHeight = Math.min(targetRect.height + 2, viewport.height / 2);
      let y: number;
      if (obstructedByElementRect.y - maxHeight > 0) {
        y = obstructedByElementRect.y - maxHeight;
      } else {
        // move beyond the bottom of the obstruction
        y = obstructedByElementRect.y - obstructedByElementRect.height + 2;
      }
      const scrollBeyondObstruction = {
        ...interactionStep,
        mousePosition: [targetRect.x, y],
      };
      await this.scroll(scrollBeyondObstruction, runFn, helper);
      return interactionStep.mousePosition;
    }

    throw new Error(`${interactionName} element isn't a ${interactionStep.command}-able target.`);
  }
}

async function delay(millis: number): Promise<void> {
  if (!millis) return;
  await new Promise<void>(resolve => setTimeout(resolve, Math.floor(millis)).unref());
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
