"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegate = void 0;
exports.isAwaitedNode = isAwaitedNode;
exports.getAwaitedState = getAwaitedState;
exports.getAwaitedPathAsMethodArg = getAwaitedPathAsMethodArg;
exports.createInstanceWithNodePointer = createInstanceWithNodePointer;
exports.convertJsPathArgs = convertJsPathArgs;
exports.execJsPath = execJsPath;
exports.cleanResult = cleanResult;
const AwaitedHandler_1 = require("@ulixee/awaited-dom/base/AwaitedHandler");
const IJsPathFunctions_1 = require("@ulixee/unblocked-specification/agent/browser/IJsPathFunctions");
const StateMachine_1 = require("@ulixee/awaited-dom/base/StateMachine");
const NodeFactory_1 = require("@ulixee/awaited-dom/base/NodeFactory");
exports.delegate = {
    getProperty,
    setProperty,
    construct,
    runMethod,
    runStatic,
    createNodePointer,
};
const storageSymbol = Symbol.for('@ulixee/InternalAwaitedState');
function isAwaitedNode(node) {
    return !!node && !!node[storageSymbol];
}
// Sets up AwaitedHandler initializer hooks. See Noderdom/AwaitedDOM
AwaitedHandler_1.default.delegate = exports.delegate;
AwaitedHandler_1.default.setStorageSymbol(storageSymbol);
async function getProperty(stateHandler, instance, name) {
    const { awaitedPath, coreFrame, awaitedOptions } = await getAwaitedState(stateHandler, instance);
    const finalPath = awaitedPath.addProperty(instance, name);
    const result = await execJsPath(coreFrame, awaitedOptions, finalPath.toJSON());
    return cleanResult(stateHandler, instance, result, new Error().stack);
}
async function setProperty(stateHandler, instance, name, value) {
    await awaitRemoteInitializer(stateHandler.getState(instance));
    stateHandler.setState(instance, { [name]: value });
}
async function runMethod(stateHandler, instance, name, args) {
    const { awaitedPath, coreFrame, awaitedOptions } = await getAwaitedState(stateHandler, instance);
    const finalPath = awaitedPath.addMethod(instance, name, ...args);
    const result = await execJsPath(coreFrame, awaitedOptions, finalPath.toJSON());
    return cleanResult(stateHandler, instance, result, new Error().stack);
}
async function createNodePointer(stateHandler, instance) {
    const { awaitedPath, coreFrame, awaitedOptions } = await getAwaitedState(stateHandler, instance);
    const finalPath = awaitedPath.addMethod(instance, IJsPathFunctions_1.getNodePointerFnName);
    const result = await execJsPath(coreFrame, awaitedOptions, finalPath.toJSON());
    return result?.nodePointer;
}
function runStatic(stateHandler, _klass, name) {
    throw new AwaitedHandler_1.NotImplementedError(`${stateHandler.className}.${name} static method not implemented`);
}
function construct(self) {
    throw new AwaitedHandler_1.NotImplementedError(`${self.className} constructor not implemented`);
}
async function getAwaitedState(stateHandler, instance) {
    const state = stateHandler.getState(instance);
    await awaitRemoteInitializer(state);
    const awaitedPath = state.awaitedPath;
    const awaitedOptions = state.awaitedOptions;
    const awaitedCoreFrame = await awaitedOptions.coreFrame;
    return { awaitedPath, coreFrame: awaitedCoreFrame, awaitedOptions };
}
function getAwaitedPathAsMethodArg(awaitedPath) {
    return `$$jsPath=${JSON.stringify(awaitedPath.toJSON())}`;
}
function createInstanceWithNodePointer(stateHandler, awaitedPath, awaitedOptions, nodePointer) {
    const createNewInstance = NodeFactory_1.default.instanceCreatorsByName[`create${nodePointer.type}`] ??
        NodeFactory_1.default.instanceCreatorsByName.createSuperNode;
    const newPath = awaitedPath.withNodeId(awaitedPath.parent, nodePointer.id);
    const element = createNewInstance(newPath, awaitedOptions);
    stateHandler.setState(element, {
        nodePointer,
    });
    element.then = null;
    return element;
}
const { getState: getAwaitedPathState } = (0, StateMachine_1.default)();
function convertJsPathArgs(path) {
    for (const part of path) {
        // if part is method call, see if any params need to be remotely initialized first
        if (!Array.isArray(part))
            continue;
        for (let i = 0; i < part.length; i += 1) {
            const param = part[i];
            if (typeof param === 'object') {
                if (Array.isArray(param)) {
                    convertJsPathArgs(param);
                }
                else {
                    const awaitedPath = getAwaitedPathState(param)?.awaitedPath;
                    if (awaitedPath) {
                        part[i] = getAwaitedPathAsMethodArg(awaitedPath);
                    }
                }
            }
        }
    }
}
async function execJsPath(coreFrame, awaitedOptions, path) {
    convertJsPathArgs(path);
    return await coreFrame.execJsPath(path);
}
function cleanResult(stateHandler, instance, result, startStack) {
    if (!result)
        return null;
    if (result.nodePointer) {
        stateHandler.setState(instance, {
            nodePointer: result.nodePointer,
        });
    }
    if (result?.pathError) {
        const error = new Error(result.pathError.error);
        error.name = 'InjectedScriptError';
        error.pathState = result.pathError.pathState;
        error.stack = startStack.replace('Error:', '').trim();
        throw error;
    }
    return result.value;
}
async function awaitRemoteInitializer(state) {
    if (state?.remoteInitializerPromise) {
        await state.remoteInitializerPromise;
    }
}
//# sourceMappingURL=SetupAwaitedHandler.js.map