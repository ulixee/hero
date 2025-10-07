"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitedPathState = void 0;
exports.extendNodes = extendNodes;
exports.extendNodeLists = extendNodeLists;
exports.isDomExtensionClass = isDomExtensionClass;
const StateMachine_1 = require("@ulixee/awaited-dom/base/StateMachine");
const SuperElement_1 = require("@ulixee/awaited-dom/impl/super-klasses/SuperElement");
const SuperNode_1 = require("@ulixee/awaited-dom/impl/super-klasses/SuperNode");
const SuperHTMLElement_1 = require("@ulixee/awaited-dom/impl/super-klasses/SuperHTMLElement");
const Element_1 = require("@ulixee/awaited-dom/impl/official-klasses/Element");
const Node_1 = require("@ulixee/awaited-dom/impl/official-klasses/Node");
const NodeList_1 = require("@ulixee/awaited-dom/impl/official-klasses/NodeList");
const HTMLCollection_1 = require("@ulixee/awaited-dom/impl/official-klasses/HTMLCollection");
const HTMLElement_1 = require("@ulixee/awaited-dom/impl/official-klasses/HTMLElement");
const AwaitedPath_1 = require("@ulixee/awaited-dom/base/AwaitedPath");
const SuperNodeList_1 = require("@ulixee/awaited-dom/impl/super-klasses/SuperNodeList");
const SuperHTMLCollection_1 = require("@ulixee/awaited-dom/impl/super-klasses/SuperHTMLCollection");
const IKeyboardLayoutUS_1 = require("@ulixee/unblocked-specification/agent/interact/IKeyboardLayoutUS");
const XPathResult_1 = require("@ulixee/awaited-dom/impl/official-klasses/XPathResult");
const create_1 = require("@ulixee/awaited-dom/impl/create");
const IKeyboardShortcuts_1 = require("@ulixee/unblocked-specification/agent/interact/IKeyboardShortcuts");
const Interactor_1 = require("./Interactor");
const SetupAwaitedHandler_1 = require("./SetupAwaitedHandler");
const DetachedElement_1 = require("./DetachedElement");
const awaitedPathState = (0, StateMachine_1.default)();
exports.awaitedPathState = awaitedPathState;
const NodeExtensionFns = {
    async $click(verification = 'elementAtPath') {
        const coreFrame = await getCoreFrame(this);
        await Interactor_1.default.run(coreFrame, [{ click: { element: this, verification } }]);
    },
    async $type(...typeInteractions) {
        const coreFrame = await getCoreFrame(this);
        await this.focus();
        await Interactor_1.default.run(coreFrame, typeInteractions.map(t => ({ type: t })));
    },
    async $waitForVisible(options) {
        const { awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        return await coreFrame.waitForElement(this, {
            waitForVisible: true,
            ...options,
        });
    },
    async $waitForClickable(options) {
        const { awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        return await coreFrame.waitForElement(this, {
            waitForClickable: true,
            ...options,
        });
    },
    async $waitForExists(options) {
        const { awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        return await coreFrame.waitForElement(this, options);
    },
    async $waitForHidden(options) {
        const { awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        return await coreFrame.waitForElement(this, {
            waitForHidden: true,
            ...options,
        });
    },
    async $clearInputText() {
        const { awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        const callsitePath = coreFrame.coreTab.coreSession.callsiteLocator.getCurrent();
        await coreFrame.coreTab.runFlowCommand(async () => {
            await this.focus();
            await Interactor_1.default.run(coreFrame, [
                { keyShortcut: IKeyboardShortcuts_1.KeyboardShortcuts.selectAll },
                { keyPress: IKeyboardLayoutUS_1.KeyboardKey.Backspace },
            ]);
        }, assert => {
            assert(this.value, x => !x);
        }, callsitePath);
    },
    $xpathSelector(selector, orderedNodeResults = false) {
        const { awaitedOptions, awaitedPath } = awaitedPathState.getState(this);
        const newPath = new AwaitedPath_1.default(null, 'document', [
            'evaluate',
            selector,
            (0, SetupAwaitedHandler_1.getAwaitedPathAsMethodArg)(awaitedPath),
            null,
            orderedNodeResults
                ? XPathResult_1.default.FIRST_ORDERED_NODE_TYPE
                : XPathResult_1.default.ANY_UNORDERED_NODE_TYPE,
        ], 'singleNodeValue');
        return (0, create_1.createSuperNode)(newPath, awaitedOptions);
    },
    async $detach() {
        const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        const detachedElementsRaw = await coreFrame.detachElement(undefined, awaitedPath.toJSON(), true, false);
        return DetachedElement_1.default.load(detachedElementsRaw[0].outerHTML);
    },
    async $addToDetachedElements(name) {
        const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        await coreFrame.detachElement(name, awaitedPath.toJSON(), false, true);
    },
};
const NodeExtensionGetters = {
    async $isClickable() {
        const coreFrame = await getCoreFrame(this);
        const visibility = await coreFrame.getComputedVisibility(this);
        return visibility.isClickable;
    },
    async $exists() {
        const coreFrame = await getCoreFrame(this);
        const visibility = await coreFrame.getComputedVisibility(this);
        return visibility.nodeExists;
    },
    async $isVisible() {
        const coreFrame = await getCoreFrame(this);
        const visibility = await coreFrame.getComputedVisibility(this);
        return visibility.isVisible;
    },
    async $hasFocus() {
        const coreFrame = await getCoreFrame(this);
        return coreFrame.isFocused(this);
    },
    $contentDocument() {
        const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
        const frameJsPath = awaitedPath.toJSON();
        const frameAwaitedPath = new AwaitedPath_1.default(null, 'document');
        return (0, create_1.createSuperDocument)(frameAwaitedPath, {
            coreFrame: awaitedOptions.coreFrame
                .then(x => {
                return Promise.all([x.coreTab, x.getChildFrameEnvironment(frameJsPath)]);
            })
                .then(([coreTab, frameMeta]) => coreTab.getCoreFrameForMeta(frameMeta)),
        });
    },
};
const NodeListExtensionFns = {
    async $map(iteratorFn) {
        let i = 0;
        const newArray = [];
        const nodes = await this;
        for (const node of nodes) {
            const newItem = await iteratorFn(node, ++i);
            newArray.push(newItem);
        }
        return newArray;
    },
    async $reduce(iteratorFn, initial) {
        const nodes = await this;
        for (const node of nodes) {
            initial = await iteratorFn(initial, node);
        }
        return initial;
    },
    async $detach() {
        const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        const detachedElementsRaw = await coreFrame.detachElement(undefined, awaitedPath.toJSON(), true, false);
        return detachedElementsRaw.map(x => DetachedElement_1.default.load(x.outerHTML));
    },
    async $addToDetachedElements(name) {
        const { awaitedPath, awaitedOptions } = awaitedPathState.getState(this);
        const coreFrame = await awaitedOptions.coreFrame;
        await coreFrame.detachElement(name, awaitedPath.toJSON(), false, true);
    },
};
function extendNodes(functions, getters) {
    for (const Item of [SuperElement_1.default, SuperNode_1.default, SuperHTMLElement_1.default, Element_1.default, Node_1.default, HTMLElement_1.default]) {
        for (const [key, value] of Object.entries(functions)) {
            void Object.defineProperty(Item.prototype, key, {
                enumerable: false,
                configurable: false,
                writable: false,
                value,
            });
        }
        for (const [key, get] of Object.entries(getters)) {
            void Object.defineProperty(Item.prototype, key, {
                enumerable: false,
                configurable: false,
                get,
            });
        }
    }
}
function extendNodeLists(functions) {
    for (const Item of [SuperNodeList_1.default, SuperHTMLCollection_1.default, NodeList_1.default, HTMLCollection_1.default]) {
        for (const [key, value] of Object.entries(functions)) {
            void Object.defineProperty(Item.prototype, key, {
                enumerable: false,
                configurable: false,
                writable: false,
                value,
            });
        }
    }
}
function isDomExtensionClass(instance) {
    if (instance instanceof SuperElement_1.default)
        return true;
    if (instance instanceof SuperNode_1.default)
        return true;
    if (instance instanceof SuperHTMLElement_1.default)
        return true;
    if (instance instanceof Element_1.default)
        return true;
    if (instance instanceof Node_1.default)
        return true;
    if (instance instanceof HTMLElement_1.default)
        return true;
    if (instance instanceof SuperNodeList_1.default)
        return true;
    if (instance instanceof SuperHTMLCollection_1.default)
        return true;
    if (instance instanceof NodeList_1.default)
        return true;
    if (instance instanceof HTMLCollection_1.default)
        return true;
    return false;
}
async function getCoreFrame(element) {
    const { awaitedOptions } = awaitedPathState.getState(element);
    return await awaitedOptions.coreFrame;
}
extendNodes(NodeExtensionFns, NodeExtensionGetters);
extendNodeLists(NodeListExtensionFns);
//# sourceMappingURL=DomExtender.js.map