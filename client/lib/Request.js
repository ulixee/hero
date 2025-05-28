"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RequestGenerator;
exports.getRequestIdOrUrl = getRequestIdOrUrl;
const Request_1 = require("@ulixee/awaited-dom/impl/official-klasses/Request");
const AwaitedPath_1 = require("@ulixee/awaited-dom/base/AwaitedPath");
const StateMachine_1 = require("@ulixee/awaited-dom/base/StateMachine");
const { getState, setState } = (0, StateMachine_1.default)();
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function RequestGenerator(coreFrame) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return class Request extends Request_1.default {
        constructor(input, init) {
            super(input, init);
            setState(this, {
                coreFrame,
                remoteInitializerPromise: createRemoteInitializer(this, coreFrame, input, init),
            });
        }
    };
}
async function createRemoteInitializer(instance, coreFramePromise, input, init) {
    const requestInput = await getRequestIdOrUrl(input);
    const coreFrame = await coreFramePromise;
    const nodePointer = await coreFrame.createRequest(requestInput, init);
    const awaitedPath = new AwaitedPath_1.default(null).withNodeId(null, nodePointer.id);
    setState(instance, {
        nodePointer,
        awaitedPath,
    });
}
async function getRequestIdOrUrl(input) {
    let requestInput;
    if (typeof input === 'string') {
        requestInput = input;
    }
    else {
        // wait for request being cloned if needed
        await getState(input).remoteInitializerPromise;
        const awaitedPath = getState(input).awaitedPath;
        requestInput = awaitedPath.toJSON()[0];
    }
    return requestInput;
}
//# sourceMappingURL=Request.js.map