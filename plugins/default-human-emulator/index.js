"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DefaultHumanEmulator_1;
Object.defineProperty(exports, "__esModule", { value: true });
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const IUnblockedPlugin_1 = require("@ulixee/unblocked-specification/plugin/IUnblockedPlugin");
const generateVector_1 = require("./generateVector");
const package_json_1 = require("./package.json");
const { log } = (0, Logger_1.default)(module);
// ATTRIBUTION: heavily borrowed/inspired by https://github.com/Xetera/ghost-cursor
let DefaultHumanEmulator = DefaultHumanEmulator_1 = class DefaultHumanEmulator {
    constructor(options) {
        this.logger = options?.logger ?? log.createChild(module);
    }
    getStartingMousePoint(helper) {
        const viewport = helper.viewportSize;
        return Promise.resolve(helper.createPointInRect({
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
        }));
    }
    async playInteractions(interactionGroups, runFn, helper) {
        for (let i = 0; i < interactionGroups.length; i += 1) {
            if (i > 0) {
                const millis = Math.random() * DefaultHumanEmulator_1.maxDelayBetweenInteractions;
                await delay(millis);
            }
            for (const step of interactionGroups[i]) {
                if (step.command === IInteractions_1.InteractionCommand.scroll) {
                    await this.scroll(step, runFn, helper);
                    continue;
                }
                if (step.command === IInteractions_1.InteractionCommand.move) {
                    await this.moveMouse(step, runFn, helper);
                    continue;
                }
                if (step.command === IInteractions_1.InteractionCommand.click ||
                    step.command === IInteractions_1.InteractionCommand.clickUp ||
                    step.command === IInteractions_1.InteractionCommand.clickDown ||
                    step.command === IInteractions_1.InteractionCommand.doubleclick) {
                    await this.moveMouseAndClick(step, runFn, helper);
                    continue;
                }
                if (step.command === IInteractions_1.InteractionCommand.type) {
                    for (const keyboardCommand of step.keyboardCommands) {
                        const millisPerCharacter = this.calculateMillisPerChar();
                        if ('string' in keyboardCommand) {
                            for (const char of keyboardCommand.string) {
                                await runFn(this.getKeyboardCommandWithDelay({ string: char }, millisPerCharacter));
                            }
                        }
                        else {
                            await runFn(this.getKeyboardCommandWithDelay(keyboardCommand, millisPerCharacter));
                        }
                    }
                    continue;
                }
                if (step.command === IInteractions_1.InteractionCommand.willDismissDialog) {
                    const millis = Math.random() * DefaultHumanEmulator_1.maxDelayBetweenInteractions;
                    await delay(millis);
                    continue;
                }
                await runFn(step);
            }
        }
    }
    async scroll(interactionStep, run, helper) {
        const scrollVector = await this.getScrollVector(interactionStep, helper);
        let counter = 0;
        for (const { x, y } of scrollVector) {
            await delay(Math.random() * DefaultHumanEmulator_1.maxScrollDelayMillis);
            const shouldAddMouseJitter = counter % Math.round(Math.random() * 6) === 0;
            if (shouldAddMouseJitter) {
                await this.jitterMouse(helper, run);
            }
            await run({
                mousePosition: [x, y],
                command: IInteractions_1.InteractionCommand.scroll,
            });
            counter += 1;
        }
    }
    async moveMouseAndClick(interactionStep, runFn, helper) {
        const { mousePosition, command, relativeToScrollOffset } = interactionStep;
        interactionStep.delayMillis ??= Math.floor(Math.random() * 100);
        delete interactionStep.relativeToScrollOffset;
        if (!mousePosition) {
            return runFn(interactionStep);
        }
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
            if (targetRect.nodeVisibility?.isClickable === false) {
                interactionStep.mousePosition = await this.resolveMoveAndClickForInvisibleNode(interactionStep, runFn, helper, targetRect);
                if (!interactionStep.simulateOptionClickOnNodeId) {
                    continue;
                }
            }
            const targetPoint = helper.createPointInRect(targetRect, {
                paddingPercent: DefaultHumanEmulator_1.boxPaddingPercent,
            });
            await this.moveMouseToPoint(interactionStep, runFn, helper, targetPoint, targetRect.width);
            let mouseResultVerifier;
            if (targetRect.nodeId &&
                command !== IInteractions_1.InteractionCommand.clickUp &&
                interactionStep.verification !== 'none') {
                const listener = await helper.createMousedownTrigger(targetRect.nodeId);
                if (listener.nodeVisibility.isClickable === false) {
                    targetRect.nodeVisibility = listener.nodeVisibility;
                    interactionStep.mousePosition = await this.resolveMoveAndClickForInvisibleNode(interactionStep, runFn, helper, targetRect);
                    continue;
                }
                mouseResultVerifier = listener.didTrigger;
            }
            await runFn({
                ...interactionStep,
                mousePosition: [targetPoint.x, targetPoint.y],
                mouseResultVerifier,
            });
            if (mouseResultVerifier) {
                const mouseUpResult = await mouseResultVerifier();
                if (!mouseUpResult.didClickLocation) {
                    continue;
                }
            }
            return;
        }
        throw new Error(`"Interaction.${interactionStep.command}" element invisible after ${retries} attempts to move it into view.`);
    }
    async moveMouse(interactionStep, run, helper) {
        const rect = await helper.lookupBoundingRect(interactionStep.mousePosition, {
            relativeToScrollOffset: interactionStep.relativeToScrollOffset,
            useLastKnownPosition: interactionStep.verification === 'none',
        });
        const targetPoint = helper.createPointInRect(rect, {
            paddingPercent: DefaultHumanEmulator_1.boxPaddingPercent,
        });
        await this.moveMouseToPoint(interactionStep, run, helper, targetPoint, rect.width);
        return targetPoint;
    }
    async moveMouseToPoint(interactionStep, runFn, helper, targetPoint, targetWidth) {
        const mousePosition = helper.mousePosition;
        const vector = (0, generateVector_1.default)(mousePosition, targetPoint, targetWidth, DefaultHumanEmulator_1.minMoveVectorPoints, DefaultHumanEmulator_1.maxMoveVectorPoints, {
            threshold: DefaultHumanEmulator_1.overshootThreshold,
            radius: DefaultHumanEmulator_1.overshootRadius,
            spread: DefaultHumanEmulator_1.overshootSpread,
        });
        if (!vector.length)
            return false;
        for (const { x, y } of vector) {
            await runFn({
                mousePosition: [x, y],
                command: IInteractions_1.InteractionCommand.move,
            });
        }
        return true;
    }
    async jitterMouse(helper, runFn) {
        const mousePosition = helper.mousePosition;
        const jitterX = Math.max(mousePosition.x + Math.round(getRandomPositiveOrNegativeNumber()), 0);
        const jitterY = Math.max(mousePosition.y + Math.round(getRandomPositiveOrNegativeNumber()), 0);
        if (jitterX !== mousePosition.x || jitterY !== mousePosition.y) {
            // jitter mouse
            await runFn({
                mousePosition: [jitterX, jitterY],
                command: IInteractions_1.InteractionCommand.move,
            });
        }
    }
    /////// KEYBOARD /////////////////////////////////////////////////////////////////////////////////////////////////////
    getKeyboardCommandWithDelay(keyboardCommand, millisPerChar) {
        const randomFactor = getRandomPositiveOrNegativeNumber() * (millisPerChar / 2);
        const delayMillis = Math.floor(randomFactor + millisPerChar);
        const keyboardKeyupDelay = Math.max(Math.ceil(Math.random() * 60), 10);
        return {
            command: IInteractions_1.InteractionCommand.type,
            keyboardCommands: [keyboardCommand],
            keyboardDelayBetween: delayMillis - keyboardKeyupDelay,
            keyboardKeyupDelay,
        };
    }
    calculateMillisPerChar() {
        if (!this.millisPerCharacter) {
            const wpmRange = DefaultHumanEmulator_1.wordsPerMinuteRange[1] - DefaultHumanEmulator_1.wordsPerMinuteRange[0];
            const wpm = Math.floor(Math.random() * wpmRange) + DefaultHumanEmulator_1.wordsPerMinuteRange[0];
            const averageWordLength = 5;
            const charsPerSecond = (wpm * averageWordLength) / 60;
            this.millisPerCharacter = Math.round(1000 / charsPerSecond);
        }
        return this.millisPerCharacter;
    }
    async getScrollVector(interactionStep, helper) {
        let shouldScrollX;
        let shouldScrollY;
        let scrollToPoint;
        const currentScrollOffset = await helper.scrollOffset;
        const { mousePosition, relativeToScrollOffset, verification } = interactionStep;
        if ((0, IInteractions_1.isMousePositionXY)(mousePosition)) {
            const [x, y] = mousePosition;
            scrollToPoint = { x, y };
            if (relativeToScrollOffset) {
                scrollToPoint.y = scrollToPoint.y + relativeToScrollOffset.y - currentScrollOffset.y;
                scrollToPoint.x = scrollToPoint.x + relativeToScrollOffset.x - currentScrollOffset.x;
            }
            shouldScrollY = scrollToPoint.y !== currentScrollOffset.y;
            shouldScrollX = scrollToPoint.x !== currentScrollOffset.x;
        }
        else {
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
            if (shouldScrollY)
                scrollToPoint.y += currentScrollOffset.y;
            else
                scrollToPoint.y = currentScrollOffset.y;
            if (shouldScrollX)
                scrollToPoint.x += currentScrollOffset.x;
            else
                scrollToPoint.x = currentScrollOffset.x;
        }
        if (!shouldScrollY && !shouldScrollX)
            return [];
        let lastPoint = currentScrollOffset;
        const maxVectorPoints = helper.doesBrowserAnimateScrolling
            ? 2
            : DefaultHumanEmulator_1.maxScrollVectorPoints;
        const scrollVector = (0, generateVector_1.default)(currentScrollOffset, scrollToPoint, 200, DefaultHumanEmulator_1.minScrollVectorPoints, maxVectorPoints, {
            threshold: DefaultHumanEmulator_1.overshootThreshold,
            radius: DefaultHumanEmulator_1.overshootRadius,
            spread: DefaultHumanEmulator_1.overshootSpread,
        });
        const points = [];
        for (let point of scrollVector) {
            // convert points into deltas from previous scroll point
            const scrollX = shouldScrollX ? Math.round(point.x) : currentScrollOffset.x;
            const scrollY = shouldScrollY ? Math.round(point.y) : currentScrollOffset.y;
            if (scrollY === lastPoint.y && scrollX === lastPoint.x)
                continue;
            if (scrollY < 0 || scrollX < 0)
                continue;
            point = {
                x: scrollX,
                y: scrollY,
            };
            const scrollYPixels = Math.abs(scrollY - lastPoint.y);
            // if too big a jump, backfill smaller jumps
            if (scrollYPixels > DefaultHumanEmulator_1.maxScrollIncrement) {
                const isNegative = scrollY < lastPoint.y;
                const chunks = splitIntoMaxLengthSegments(scrollYPixels, DefaultHumanEmulator_1.maxScrollIncrement);
                for (const chunk of chunks) {
                    const deltaY = isNegative ? -chunk : chunk;
                    const scrollYChunk = Math.max(lastPoint.y + deltaY, 0);
                    if (scrollYChunk === lastPoint.y)
                        continue;
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
    async resolveMoveAndClickForInvisibleNode(interactionStep, runFn, helper, targetRect) {
        const { nodeVisibility } = targetRect;
        const viewport = helper.viewportSize;
        const interactionName = `"Interaction.${interactionStep.command}"`;
        const { hasDimensions, isConnected, nodeExists } = nodeVisibility;
        helper.logger.warn(`${interactionName} element not visible.`, {
            interactionStep,
            target: targetRect,
            viewport,
        });
        if (!nodeExists)
            throw new Error(`${interactionName} element does not exist.`);
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
            if (obstructedByElementRect.height >= viewport.height * 0.9)
                throw new Error(`${interactionName} element is obstructed by a full screen element`);
            const maxHeight = Math.min(targetRect.height + 2, viewport.height / 2);
            let y;
            if (obstructedByElementRect.y - maxHeight > 0) {
                y = obstructedByElementRect.y - maxHeight;
            }
            else if (obstructedByElementRect.y - (targetRect.height + 2) > 0) {
                y = obstructedByElementRect.y - targetRect.height - 2;
            }
            else {
                // move beyond the bottom of the obstruction
                y = obstructedByElementRect.y - obstructedByElementRect.height + 2;
            }
            const scrollBeyondObstruction = {
                ...interactionStep,
                mousePosition: [targetRect.x, y],
            };
            helper.logger.info('Scrolling to avoid obstruction', {
                obstructedByElementRect,
                scrollBeyondObstruction,
            });
            await this.scroll(scrollBeyondObstruction, runFn, helper);
            return interactionStep.mousePosition;
        }
        throw new Error(`${interactionName} element isn't a ${interactionStep.command}-able target.`);
    }
};
DefaultHumanEmulator.id = package_json_1.name;
DefaultHumanEmulator.overshootSpread = 2;
DefaultHumanEmulator.overshootRadius = 5;
DefaultHumanEmulator.overshootThreshold = 250;
DefaultHumanEmulator.boxPaddingPercent = { width: 33, height: 33 };
// NOTE: max steps are not total max if you overshoot. It's max per section
DefaultHumanEmulator.minMoveVectorPoints = 5;
DefaultHumanEmulator.maxMoveVectorPoints = 50;
DefaultHumanEmulator.minScrollVectorPoints = 10;
DefaultHumanEmulator.maxScrollVectorPoints = 25;
DefaultHumanEmulator.maxScrollIncrement = 500;
DefaultHumanEmulator.maxScrollDelayMillis = 15;
DefaultHumanEmulator.maxDelayBetweenInteractions = 200;
DefaultHumanEmulator.wordsPerMinuteRange = [80, 100];
DefaultHumanEmulator = DefaultHumanEmulator_1 = __decorate([
    IUnblockedPlugin_1.UnblockedPluginClassDecorator
], DefaultHumanEmulator);
exports.default = DefaultHumanEmulator;
async function delay(millis) {
    if (!millis)
        return;
    await new Promise(resolve => setTimeout(resolve, Math.floor(millis)).unref());
}
function splitIntoMaxLengthSegments(total, maxValue) {
    const values = [];
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
//# sourceMappingURL=index.js.map