"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const utils_1 = require("@ulixee/commons/lib/utils");
const IKeyboardLayoutUS_1 = require("@ulixee/unblocked-specification/agent/interact/IKeyboardLayoutUS");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const MouseListener_1 = require("./MouseListener");
const rectUtils = require("./rectUtils");
const commandsNeedingScroll = new Set([
    IInteractions_1.InteractionCommand.click,
    IInteractions_1.InteractionCommand.doubleclick,
    IInteractions_1.InteractionCommand.move,
]);
const mouseCommands = new Set([
    IInteractions_1.InteractionCommand.move,
    IInteractions_1.InteractionCommand.click,
    IInteractions_1.InteractionCommand.doubleclick,
    IInteractions_1.InteractionCommand.click,
    IInteractions_1.InteractionCommand.clickUp,
    IInteractions_1.InteractionCommand.clickDown,
].map(String));
class Interactor {
    get mousePosition() {
        return { ...this.mouse.position };
    }
    get scrollOffset() {
        return this.getWindowOffset().then(offset => {
            return {
                x: offset.scrollX,
                y: offset.scrollY,
                width: offset.scrollWidth,
                height: offset.scrollHeight,
            };
        });
    }
    get doesBrowserAnimateScrolling() {
        return this.browserContext.browser.engine.doesBrowserAnimateScrolling;
    }
    get hooks() {
        return this.frame.hooks;
    }
    get browserContext() {
        return this.frame.page.browserContext;
    }
    get jsPath() {
        return this.frame.jsPath;
    }
    get mouse() {
        return this.frame.page.mouse;
    }
    get keyboard() {
        return this.frame.page.keyboard;
    }
    constructor(frame) {
        // Publish rect utils
        this.isPointWithinRect = rectUtils.isPointWithinRect;
        this.createPointInRect = rectUtils.createPointInRect;
        this.createScrollPointForRect = rectUtils.createScrollPointForRect;
        this.isRectInViewport = rectUtils.isRectInViewport;
        this.playAllInteractions = Interactor.defaultPlayInteractions;
        this.frame = frame;
        this.logger = frame.logger.createChild(module);
        if (this.hooks.playInteractions) {
            this.playAllInteractions = this.hooks.playInteractions.bind(this.hooks);
        }
    }
    async initialize() {
        // can't run javascript if active dialog!
        if (this.frame.page.activeDialog)
            return;
        this.isReady ??= this.initializeViewport(!this.frame.parentId);
        return await this.isReady;
    }
    play(interactions, resolvablePromise) {
        this.browserContext.commandMarker.incrementMark?.('interact');
        this.preInteractionPaintStableStatus = this.frame.navigations.getPaintStableStatus();
        this.logger.info('Interactor.play', { interactions });
        this.injectScrollToPositions(interactions)
            .then(async (finalInteractions) => {
            try {
                await this.initialize();
                return await this.playAllInteractions(finalInteractions, this.playInteraction.bind(this, resolvablePromise), this);
            }
            finally {
                // eslint-disable-next-line promise/always-return
                await this.afterInteractionGroups?.();
            }
        })
            .then(resolvablePromise.resolve)
            .catch(resolvablePromise.reject);
    }
    async reloadJsPath(jsPath) {
        const containerOffset = await this.frame.getContainerOffset();
        const result = await this.jsPath.reloadJsPath(jsPath, containerOffset);
        return result.nodePointer;
    }
    async lookupBoundingRect(mousePosition, options) {
        if (mousePosition === null) {
            throw new Error('Null mouse position provided to frame.interact');
        }
        if ((0, IInteractions_1.isMousePositionXY)(mousePosition)) {
            let [x, y] = mousePosition;
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
        if (options?.useLastKnownPosition &&
            typeof mousePosition[0] === 'number' &&
            mousePosition.length === 1) {
            const nodeId = mousePosition[0];
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
        const rectResult = await this.jsPath.getClientRect(mousePosition, options?.includeNodeVisibility);
        const rect = rectResult.value;
        const nodePointer = rectResult.nodePointer;
        if (!nodePointer)
            throw new Error('Element does not exist.');
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
    async createMousedownTrigger(nodeId) {
        (0, utils_1.assert)(nodeId, 'nodeId should not be null');
        const mouseListener = new MouseListener_1.default(this.frame, nodeId);
        const nodeVisibility = await mouseListener.register();
        let mouseResult;
        return {
            nodeVisibility,
            didTrigger: async () => {
                if (mouseResult)
                    return mouseResult;
                mouseResult = await mouseListener.didTriggerMouseEvent();
                mouseResult.didStartInteractWithPaintingStable =
                    this.preInteractionPaintStableStatus?.isStable === true;
                return mouseResult;
            },
        };
    }
    async playInteraction(resolvable, interactionStep) {
        if (resolvable.isResolved) {
            this.logger.warn('Canceling interaction due to external event');
            throw new IPendingWaitEvent_1.CanceledPromiseError('Canceling interaction due to external event');
        }
        const startTime = Date.now();
        await this.beforeEachInteractionStep?.(interactionStep, mouseCommands.has(interactionStep.command));
        switch (interactionStep.command) {
            case IInteractions_1.InteractionCommand.move: {
                const [x, y] = await this.getMousePositionXY(interactionStep);
                await this.mouse.move(x, y);
                break;
            }
            case IInteractions_1.InteractionCommand.scroll: {
                const scrollOffset = await this.scrollOffset;
                let scrollToY = scrollOffset.y;
                let scrollToX = scrollOffset.x;
                // if this is a JsPath, see if we actually need to scroll
                if ((0, IInteractions_1.isMousePositionXY)(interactionStep.mousePosition) === false) {
                    const interactRect = await this.getInteractionRect(interactionStep);
                    const isRectVisible = this.isRectInViewport(interactRect, this.viewportSize, 50);
                    if (isRectVisible.all)
                        return;
                    const pointForRect = this.createScrollPointForRect(interactRect, this.viewportSize);
                    // positions are all relative to viewport, so normalize based on the current offsets
                    if (!isRectVisible.height)
                        scrollToY += pointForRect.y;
                    if (!isRectVisible.width)
                        scrollToX += pointForRect.x;
                }
                else {
                    [scrollToX, scrollToY] = interactionStep.mousePosition;
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
            case IInteractions_1.InteractionCommand.click:
            case IInteractions_1.InteractionCommand.clickUp:
            case IInteractions_1.InteractionCommand.clickDown:
            case IInteractions_1.InteractionCommand.doubleclick: {
                const { delayMillis, mouseButton, command, mouseResultVerifier } = interactionStep;
                let interactRect;
                // if this is a jsPath, need to look it up
                if (interactionStep.mousePosition &&
                    (0, IInteractions_1.isMousePositionXY)(interactionStep.mousePosition) === false) {
                    interactRect = await this.getInteractionRect(interactionStep);
                    if (interactRect.elementTag === 'option') {
                        // options need a browser level call
                        interactionStep.simulateOptionClickOnNodeId = interactRect.nodeId;
                        interactionStep.verification = 'none';
                    }
                }
                if (command === IInteractions_1.InteractionCommand.click && interactionStep.simulateOptionClickOnNodeId) {
                    await this.jsPath.simulateOptionClick([interactionStep.simulateOptionClickOnNodeId]);
                    break;
                }
                const [x, y] = await this.getMousePositionXY(interactionStep, true, interactRect);
                await this.mouse.move(x, y);
                const button = mouseButton || 'left';
                const clickCount = command === IInteractions_1.InteractionCommand.doubleclick ? 2 : 1;
                if (command !== IInteractions_1.InteractionCommand.clickUp) {
                    await this.mouse.down({ button, clickCount });
                }
                if (delayMillis) {
                    await waitFor(delayMillis, resolvable);
                }
                // don't click up if verification failed
                if (mouseResultVerifier) {
                    const result = await mouseResultVerifier();
                    if (!result.didClickLocation)
                        break;
                }
                if (command !== IInteractions_1.InteractionCommand.clickDown) {
                    await this.mouse.up({ button, clickCount });
                }
                break;
            }
            case IInteractions_1.InteractionCommand.type: {
                let counter = 0;
                for (const keyboardCommand of interactionStep.keyboardCommands) {
                    const delay = interactionStep.keyboardDelayBetween;
                    const keyupDelay = interactionStep.keyboardKeyupDelay;
                    if (counter > 0 && delay) {
                        await waitFor(delay, resolvable);
                    }
                    if ('keyCode' in keyboardCommand) {
                        const key = (0, IKeyboardLayoutUS_1.getKeyboardKey)(keyboardCommand.keyCode);
                        await this.keyboard.press(key, keyupDelay);
                    }
                    else if ('up' in keyboardCommand) {
                        const key = (0, IKeyboardLayoutUS_1.getKeyboardKey)(keyboardCommand.up);
                        await this.keyboard.up(key);
                    }
                    else if ('down' in keyboardCommand) {
                        const key = (0, IKeyboardLayoutUS_1.getKeyboardKey)(keyboardCommand.down);
                        await this.keyboard.down(key);
                    }
                    else if ('shortcut' in keyboardCommand) {
                        await this.keyboard.command(keyboardCommand.shortcut);
                    }
                    else if ('string' in keyboardCommand) {
                        const text = keyboardCommand.string;
                        for (const char of text) {
                            if (char in IKeyboardLayoutUS_1.KeyboardKey) {
                                await this.keyboard.press(char, keyupDelay);
                            }
                            else {
                                await this.keyboard.sendCharacter(char);
                            }
                            if (delay)
                                await waitFor(delay, resolvable);
                        }
                    }
                    counter += 1;
                }
                break;
            }
            case IInteractions_1.InteractionCommand.waitForMillis: {
                await waitFor(interactionStep.delayMillis, resolvable);
                break;
            }
        }
        await this.afterEachInteractionStep?.(interactionStep, startTime);
    }
    async getWindowOffset() {
        const windowOffset = await this.frame.getWindowOffset();
        this.viewportSize = { width: windowOffset.innerWidth, height: windowOffset.innerHeight };
        return windowOffset;
    }
    async initializeViewport(isMainFrame) {
        await this.getWindowOffset();
        if (isMainFrame) {
            await this.hooks?.adjustStartingMousePoint?.(this.mouse.position, this);
        }
    }
    async getInteractionRect(interactionStep) {
        const mousePosition = interactionStep.mousePosition;
        return await this.lookupBoundingRect(mousePosition, {
            relativeToScrollOffset: interactionStep.relativeToScrollOffset,
            useLastKnownPosition: interactionStep.verification === 'none',
        });
    }
    async getMousePositionXY(interactionStep, constrainToViewport = true, rect) {
        if (!interactionStep.mousePosition)
            return [this.mouse.position.x, this.mouse.position.y];
        rect ??= await this.getInteractionRect(interactionStep);
        if ((0, IInteractions_1.isMousePositionXY)(interactionStep.mousePosition)) {
            return [rect.x, rect.y];
        }
        const point = await rectUtils.createPointInRect(rect, {
            paddingPercent: { height: 10, width: 10 },
            constrainToViewport: constrainToViewport ? this.viewportSize : undefined,
        });
        return [point.x, point.y];
    }
    async injectScrollToPositions(interactions) {
        const finalInteractions = [];
        let relativeToScrollOffset;
        for (const group of interactions) {
            const groupCommands = [];
            finalInteractions.push(groupCommands);
            for (const step of group) {
                if (commandsNeedingScroll.has(IInteractions_1.InteractionCommand[step.command]) && step.mousePosition) {
                    if ((0, IInteractions_1.isMousePositionXY)(step.mousePosition)) {
                        relativeToScrollOffset ??= await this.scrollOffset;
                    }
                    groupCommands.push({
                        command: IInteractions_1.InteractionCommand.scroll,
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
    static async defaultPlayInteractions(interactionGroups, runFn) {
        for (const group of interactionGroups) {
            for (const step of group) {
                await runFn(step);
            }
        }
    }
}
exports.default = Interactor;
async function waitFor(millis, resolvable) {
    if (millis === undefined || millis === null)
        return;
    await Promise.race([
        resolvable.promise,
        new Promise(resolve => setTimeout(resolve, millis).unref()),
    ]);
}
//# sourceMappingURL=Interactor.js.map