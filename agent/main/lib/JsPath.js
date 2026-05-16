"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsPath = void 0;
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const IInteractions_1 = require("@ulixee/unblocked-specification/agent/interact/IInteractions");
const IJsPathFunctions_1 = require("@ulixee/unblocked-specification/agent/browser/IJsPathFunctions");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const InjectedScriptError_1 = require("../errors/InjectedScriptError");
const InjectedScripts_1 = require("./InjectedScripts");
class JsPath {
    constructor(frame, logger) {
        this.clientRectByNodePointerId = new Map();
        this.nodeIdRedirectToNewNodeId = {};
        this.nodeIdToJsPathSource = new Map();
        this.frame = frame;
        this.logger = logger.createChild(module);
    }
    getLastClientRect(nodeId) {
        return this.clientRectByNodePointerId.get(nodeId);
    }
    getClientRect(jsPath, includeNodeVisibility) {
        const fnCall = this.getJsPathMethod(jsPath);
        if (fnCall !== IJsPathFunctions_1.getClientRectFnName) {
            jsPath = [...jsPath, [IJsPathFunctions_1.getClientRectFnName, includeNodeVisibility]];
        }
        return this.exec(jsPath);
    }
    async exec(jsPath, timeoutMs) {
        await this.frame.navigationsObserver.waitForLoad(Location_1.LoadStatus.JavascriptReady, {
            timeoutMs: timeoutMs ?? 30e3,
            doNotIncrementMarker: true,
        });
        const containerOffset = await this.frame.getContainerOffset();
        return this.runJsPath(`exec`, jsPath, containerOffset);
    }
    async reloadJsPath(jsPath, containerOffset) {
        if (typeof jsPath[0] === 'number' && !(0, IInteractions_1.isMousePositionXY)(jsPath.slice(0, 2))) {
            const paths = this.getJsPathHistoryForNode(jsPath[0]);
            for (const path of paths) {
                const result = await this.getNodePointer(path.jsPath, containerOffset);
                const nodeId = result.nodePointer?.id;
                if (nodeId && nodeId !== path.nodeId) {
                    this.logger.info('JsPath.nodeRedirectFound', {
                        sourceNodeId: path.nodeId,
                        newNodeId: nodeId,
                        jsPath: path.jsPath,
                    });
                    this.nodeIdRedirectToNewNodeId[path.nodeId] = nodeId;
                }
            }
        }
        return this.getNodePointer(jsPath, containerOffset);
    }
    getNodePointerId(jsPath) {
        const fnCall = this.getJsPathMethod(jsPath);
        if (fnCall !== IJsPathFunctions_1.getNodeIdFnName && fnCall !== IJsPathFunctions_1.getNodeIdFnName) {
            jsPath = [...jsPath, [IJsPathFunctions_1.getNodeIdFnName]];
        }
        return this.runJsPath(`exec`, jsPath).then(x => x.value);
    }
    getNodePointer(jsPath, containerOffset = { x: 0, y: 0 }) {
        const fnCall = this.getJsPathMethod(jsPath);
        if (fnCall !== IJsPathFunctions_1.getClientRectFnName && fnCall !== IJsPathFunctions_1.getNodePointerFnName) {
            jsPath = [...jsPath, [IJsPathFunctions_1.getNodePointerFnName]];
        }
        return this.runJsPath(`exec`, jsPath, containerOffset);
    }
    getNodeVisibility(jsPath) {
        const fnCall = this.getJsPathMethod(jsPath);
        if (fnCall !== IJsPathFunctions_1.getComputedVisibilityFnName) {
            jsPath = [...jsPath, [IJsPathFunctions_1.getComputedVisibilityFnName]];
        }
        return this.runJsPath(`exec`, jsPath).then(x => x.value);
    }
    simulateOptionClick(jsPath) {
        return this.runJsPath(`simulateOptionClick`, jsPath);
    }
    getSourceJsPath(nodePointer) {
        const path = [];
        const history = this.getJsPathHistoryForNode(nodePointer.id);
        for (const entry of history) {
            const jsPath = entry.jsPath;
            if (typeof jsPath[0] === 'number') {
                path.push(...jsPath.slice(1));
            }
            else {
                path.push(...jsPath);
            }
        }
        return path;
    }
    replaceRedirectedJsPathNodePointer(jsPath) {
        if (typeof jsPath[0] === 'number') {
            let id = jsPath[0];
            while (id) {
                const nextId = this.nodeIdRedirectToNewNodeId[id];
                if (nextId === undefined || nextId === id)
                    break;
                id = nextId;
            }
            jsPath[0] = id;
        }
    }
    async runJsPath(fnName, jsPath, ...args) {
        this.replaceRedirectedJsPathNodePointer(jsPath);
        const result = await this.runInjectedScriptFn(`${InjectedScripts_1.default.JsPath}.${fnName}`, jsPath, ...args);
        if (result.pathError) {
            throw new InjectedScriptError_1.default(result.pathError.error, result.pathError.pathState);
        }
        else if (result?.isValueSerialized === true) {
            result.isValueSerialized = undefined;
            result.value = TypeSerializer_1.default.revive(result.value, 'BROWSER');
        }
        if (fnName === 'exec' || fnName === 'waitForElement') {
            this.recordExecResult(jsPath, result);
        }
        return result;
    }
    async runInjectedScriptFn(fnName, ...args) {
        const serializedFn = `${fnName}(${args
            .map(x => {
            if (!x)
                return 'undefined';
            return JSON.stringify(x);
        })
            .join(', ')})`;
        const result = await this.frame.evaluate(serializedFn, {
            isolateFromWebPageEnvironment: this.frame.page.installJsPathIntoIsolatedContext,
        });
        if (result?.error) {
            this.logger.error(fnName, { result });
            throw new InjectedScriptError_1.default(result.error);
        }
        else {
            return result;
        }
    }
    getJsPathHistoryForNode(nodeId) {
        const paths = [];
        let sourcePath;
        // eslint-disable-next-line no-cond-assign
        while ((sourcePath = this.nodeIdToJsPathSource.get(nodeId))) {
            paths.unshift({ nodeId, jsPath: sourcePath.jsPath });
            nodeId = sourcePath.parentNodeId;
            if (!nodeId)
                break;
        }
        return paths;
    }
    recordExecResult(jsPath, result) {
        if (!result.nodePointer)
            return;
        // try to record last known position
        const method = this.getJsPathMethod(jsPath);
        const { id, iterableItems, iterableIsNodePointers } = result.nodePointer;
        const parentNodeId = typeof jsPath[0] === 'number' ? jsPath[0] : undefined;
        if (method === IJsPathFunctions_1.getClientRectFnName) {
            this.clientRectByNodePointerId.set(result.nodePointer.id, result.value);
        }
        else if (method === IJsPathFunctions_1.getComputedVisibilityFnName) {
            const clientRect = result.value.boundingClientRect;
            this.clientRectByNodePointerId.set(result.nodePointer.id, clientRect);
        }
        const cleanJsPath = [...jsPath];
        if (method && method.startsWith('__'))
            cleanJsPath.pop();
        const queryIndex = this.nodeIdToJsPathSource.get(id);
        if (!queryIndex) {
            this.nodeIdToJsPathSource.set(id, {
                isFromIterable: false,
                parentNodeId,
                jsPath: cleanJsPath,
            });
        }
        if (iterableIsNodePointers) {
            for (let i = 0; i < iterableItems.length; i += 1) {
                const nodePointer = iterableItems[i];
                if (this.nodeIdToJsPathSource.has(nodePointer.id))
                    continue;
                this.nodeIdToJsPathSource.set(nodePointer.id, {
                    isFromIterable: true,
                    jsPath: [...cleanJsPath, String(i)],
                    parentNodeId,
                });
            }
        }
    }
    getJsPathMethod(jsPath) {
        const last = jsPath[jsPath.length - 1];
        return Array.isArray(last) ? last[0] : '';
    }
}
exports.JsPath = JsPath;
//# sourceMappingURL=JsPath.js.map