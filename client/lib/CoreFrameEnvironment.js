"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const IJsPathFunctions_1 = require("@ulixee/unblocked-specification/agent/browser/IJsPathFunctions");
const StateMachine_1 = require("@ulixee/awaited-dom/base/StateMachine");
const TimeoutError_1 = require("@ulixee/commons/interfaces/TimeoutError");
const SetupAwaitedHandler_1 = require("./SetupAwaitedHandler");
const awaitedPathState = (0, StateMachine_1.default)();
class CoreFrameEnvironment {
    constructor(coreTab, meta, parentFrameId) {
        const { tabId, sessionId, frameId, sessionName } = meta;
        this.tabId = tabId;
        this.coreTab = coreTab;
        this.sessionId = sessionId;
        this.frameId = frameId;
        this.parentFrameId = parentFrameId;
        const queueMeta = {
            sessionId,
            tabId,
            sessionName,
            frameId,
        };
        this.commandQueue = coreTab.commandQueue.createSharedQueue(queueMeta);
    }
    async getFrameMeta() {
        return await this.commandQueue.run('FrameEnvironment.meta');
    }
    async getChildFrameEnvironment(jsPath) {
        return await this.commandQueue.run('FrameEnvironment.getChildFrameEnvironment', jsPath);
    }
    async execJsPath(jsPath) {
        return await this.commandQueue.run('FrameEnvironment.execJsPath', jsPath);
    }
    async getJsValue(expression) {
        return await this.commandQueue.run('FrameEnvironment.getJsValue', expression);
    }
    async fetch(request, init) {
        return await this.commandQueue.run('FrameEnvironment.fetch', request, init);
    }
    async createRequest(input, init) {
        return await this.commandQueue.run('FrameEnvironment.createRequest', input, init);
    }
    async detachElement(name, jsPath, waitForElement = false, saveToDb = true) {
        return await this.commandQueue.run('FrameEnvironment.detachElement', name, jsPath, Date.now(), waitForElement, saveToDb);
    }
    async getUrl() {
        return await this.commandQueue.run('FrameEnvironment.getUrl');
    }
    async isPaintingStable() {
        return await this.commandQueue.run('FrameEnvironment.isPaintingStable');
    }
    async isDomContentLoaded() {
        return await this.commandQueue.run('FrameEnvironment.isDomContentLoaded');
    }
    async isAllContentLoaded() {
        return await this.commandQueue.run('FrameEnvironment.isAllContentLoaded');
    }
    async interact(interactionGroups) {
        for (const interactionGroup of interactionGroups) {
            for (const interactionStep of interactionGroup) {
                if (interactionStep.mousePosition && !(0, IInteractions_1.isMousePositionXY)(interactionStep.mousePosition)) {
                    (0, SetupAwaitedHandler_1.convertJsPathArgs)(interactionStep.mousePosition);
                }
            }
        }
        await this.commandQueue.run('FrameEnvironment.interact', ...interactionGroups);
    }
    async getComputedVisibility(node) {
        return await SetupAwaitedHandler_1.delegate.runMethod(awaitedPathState, node, IJsPathFunctions_1.getComputedVisibilityFnName, []);
    }
    async isFocused(element) {
        return await SetupAwaitedHandler_1.delegate.runMethod(awaitedPathState, element, IJsPathFunctions_1.isFocusedFnName, []);
    }
    async getNodePointer(node) {
        return await SetupAwaitedHandler_1.delegate.createNodePointer(awaitedPathState, node);
    }
    async getCookies() {
        return await this.commandQueue.run('FrameEnvironment.getCookies');
    }
    async setCookie(name, value, options) {
        return await this.commandQueue.run('FrameEnvironment.setCookie', name, value, options);
    }
    async removeCookie(name) {
        return await this.commandQueue.run('FrameEnvironment.removeCookie', name);
    }
    async setFileInputFiles(jsPath, files) {
        return await this.commandQueue.run('FrameEnvironment.setFileInputFiles', jsPath, files);
    }
    async waitForElement(element, options) {
        if (!element)
            throw new Error('Element being waited for is null');
        const { waitForVisible, waitForHidden, waitForClickable, timeoutMs } = options ?? {};
        try {
            await this.coreTab.waitForState({
                all(assert) {
                    if (waitForVisible)
                        assert(element.$isVisible);
                    else if (waitForClickable)
                        assert(element.$isClickable);
                    else if (waitForHidden)
                        assert(element.$isVisible, false);
                    else
                        assert(element.$exists);
                },
            }, { timeoutMs });
        }
        catch (error) {
            if (error instanceof TimeoutError_1.default) {
                let state;
                if (waitForHidden)
                    state = 'be hidden';
                else if (waitForClickable)
                    state = 'be clickable';
                else if (waitForVisible)
                    state = 'be visible';
                else
                    state = 'exist';
                const message = error.message;
                error.message = `Timeout waiting for element to ${state}`;
                error.stack = error.stack.replace(message, error.message);
                throw error;
            }
            throw error;
        }
        const nodePointer = await this.getNodePointer(element);
        if (!nodePointer)
            return null;
        const { awaitedOptions, awaitedPath } = awaitedPathState.getState(element);
        return (0, SetupAwaitedHandler_1.createInstanceWithNodePointer)(awaitedPathState, awaitedPath, awaitedOptions, nodePointer);
    }
    async waitForLoad(status, opts) {
        await this.commandQueue.run('FrameEnvironment.waitForLoad', status, opts);
    }
    async waitForLocation(trigger, opts) {
        return await this.commandQueue.run('FrameEnvironment.waitForLocation', trigger, opts);
    }
}
exports.default = CoreFrameEnvironment;
//# sourceMappingURL=CoreFrameEnvironment.js.map