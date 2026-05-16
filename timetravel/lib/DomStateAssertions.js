"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DomStateAssertions {
    constructor() {
        this.assertsBySessionId = {};
    }
    iterateSessionAssertionsByFrameId(sessionId) {
        this.assertsBySessionId[sessionId] ??= {};
        const assertions = this.assertsBySessionId[sessionId];
        return Object.entries(assertions);
    }
    sessionAssertionsCount(sessionId) {
        return DomStateAssertions.countAssertions(this.assertsBySessionId[sessionId]);
    }
    getSessionAssertionWithQuery(sessionId, frameId, query) {
        if (!this.assertsBySessionId[sessionId])
            return;
        const frameAssertions = this.assertsBySessionId[sessionId][frameId];
        if (frameAssertions)
            return frameAssertions[query];
    }
    clearSessionAssertions(sessionId) {
        this.assertsBySessionId[sessionId] = {};
    }
    recordAssertion(sessionId, frameId, assert) {
        this.assertsBySessionId[sessionId] ??= {};
        this.assertsBySessionId[sessionId][frameId] ??= {};
        const assertion = assert;
        assertion.key ??= DomStateAssertions.generateKey(assertion.type, assertion.args);
        this.assertsBySessionId[sessionId][frameId][assertion.key] = assertion;
    }
    getCommonSessionAssertions(sessionIds, startingAssertions) {
        // clone starting point
        let state = clone(startingAssertions);
        for (const sessionId of sessionIds) {
            // need a starting place
            if (!state) {
                state = clone(this.assertsBySessionId[sessionId]);
                continue;
            }
            const sessionAssertionsByFrameId = this.assertsBySessionId[sessionId] ?? {};
            // now compare other sessions to "starting state"
            // TODO: match frames better than just "id" (check frame loaded url/name/id/dom path)
            for (const [frameId, sessionAssertions] of Object.entries(sessionAssertionsByFrameId)) {
                for (const [key, sessionAssert] of Object.entries(sessionAssertions)) {
                    if (!state[frameId])
                        continue;
                    const sharedAssertion = state[frameId][key];
                    if (!sharedAssertion)
                        continue;
                    if (sharedAssertion.result === sessionAssert.result) {
                        continue;
                    }
                    if (typeof sharedAssertion.result === 'number' &&
                        typeof sessionAssert.result === 'number') {
                        sharedAssertion.result = Math.min(sharedAssertion.result, sessionAssert.result);
                        sharedAssertion.comparison = '>=';
                        continue;
                    }
                    delete state[frameId][key];
                }
            }
            // remove anything in the shared state that's not in this run
            for (const [frameId, sharedAssertions] of Object.entries(state)) {
                for (const key of Object.keys(sharedAssertions)) {
                    const sessionFrameAssertions = sessionAssertionsByFrameId[frameId];
                    if (!sessionFrameAssertions) {
                        delete state[frameId];
                    }
                    else if (!sessionFrameAssertions[key]) {
                        delete state[frameId][key];
                    }
                }
            }
        }
        return state ?? {};
    }
    static countAssertions(asserts) {
        const result = { total: 0, dom: 0, resources: 0, urls: 0, storage: 0 };
        if (!asserts)
            return result;
        for (const assertionsWithResults of Object.values(asserts)) {
            for (const assert of Object.values(assertionsWithResults)) {
                result.total += 1;
                if (assert.type === 'jspath' || assert.type === 'xpath')
                    result.dom += 1;
                else if (assert.type === 'resource')
                    result.resources += 1;
                else if (assert.type === 'url')
                    result.urls += 1;
                else if (assert.type === 'storage')
                    result.storage += 1;
            }
        }
        return result;
    }
    static generateKey(type, args) {
        return [type, args ? JSON.stringify(args) : ''].join(':');
    }
    static removeAssertsSharedBetweenStates(states) {
        for (const state of states) {
            for (const [frameId, asserts] of Object.entries(state)) {
                for (const path of Object.keys(asserts)) {
                    for (const otherState of states) {
                        if (otherState === state)
                            continue;
                        // TODO: match frames better than just "id" (check frame loaded url/name/id/dom path)
                        const otherAsserts = otherState[frameId];
                        if (!otherAsserts) {
                            break;
                        }
                        // if path and result is same, delete
                        if (otherAsserts[path] && asserts[path].result === otherAsserts[path].result) {
                            delete otherAsserts[path];
                            delete asserts[path];
                        }
                    }
                }
            }
        }
    }
}
exports.default = DomStateAssertions;
function clone(obj) {
    if (!obj)
        return obj;
    return JSON.parse(JSON.stringify(obj));
}
//# sourceMappingURL=DomStateAssertions.js.map