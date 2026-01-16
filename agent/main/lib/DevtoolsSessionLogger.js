"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const Frame_1 = require("./Frame");
const BrowserContext_1 = require("./BrowserContext");
class DevtoolsSessionLogger extends eventUtils_1.TypedEventEmitter {
    constructor(browserContext) {
        super();
        this.browserContext = browserContext;
        this.events = new EventSubscriber_1.default();
        this.fetchRequestIdToNetworkId = new Map();
        this.devtoolsSessions = new WeakSet();
        this.requestsToSkip = new Set();
        this.browserContextInitiatedMessageIds = new Set();
        this.sentMessagesById = {};
        this.truncateMessageResponses = DevtoolsSessionLogger.defaultTruncateMessageResponses;
        this.truncateParams = DevtoolsSessionLogger.defaultTruncateParams;
        this.logger = browserContext.logger.createChild(module);
        this.storeEventsWithoutListeners = true;
    }
    close() {
        this.events.close();
        this.browserContextInitiatedMessageIds.clear();
        this.sentMessagesById = {};
        this.browserContext = null;
    }
    subscribeToDevtoolsMessages(devtoolsSession, details) {
        if (this.devtoolsSessions.has(devtoolsSession))
            return;
        this.devtoolsSessions.add(devtoolsSession);
        this.events.on(devtoolsSession.messageEvents, 'receive', this.onEventReceive.bind(this, details), true);
        this.events.on(devtoolsSession.messageEvents, 'send', this.onEventSend.bind(this, details), true);
    }
    onEventSend(details, event, initiator) {
        // if sent from browser, only include when matching context id
        if (details.sessionType === 'browser') {
            // don't include other browser context messages
            if (initiator && initiator instanceof BrowserContext_1.default && initiator !== this.browserContext) {
                return;
            }
            this.browserContextInitiatedMessageIds.add(event.id);
        }
        if (initiator && initiator instanceof Frame_1.default) {
            event.frameId = initiator.id;
        }
        this.filterAndSendMessage({
            direction: 'send',
            ...details,
            ...event,
        });
    }
    onEventReceive(details, event) {
        if (details.sessionType === 'browser') {
            // see if this was initiated by this browser context
            if ('id' in event && !this.browserContextInitiatedMessageIds.has(event.id))
                return;
            if ('params' in event) {
                const isOtherContext = this.isOtherBrowserContextTarget(event.params.targetInfo);
                if (isOtherContext)
                    return;
            }
        }
        this.filterAndSendMessage({
            direction: 'receive',
            ...details,
            ...event,
        });
    }
    isOtherBrowserContextTarget(target) {
        if (!target?.browserContextId)
            return false;
        return target.browserContextId !== this.browserContext.id;
    }
    filterAndSendMessage(event) {
        const params = event.params;
        let frameId = event.frameId;
        let requestId;
        let pageId = event.pageTargetId;
        // Filter out internal communication to prevent lots of duplicate events and data
        if (event.method === 'Console.messageAdded' && params.message.text.startsWith('hero:')) {
            return;
        }
        if (params) {
            frameId = frameId ?? params.frame?.id ?? params.frameId ?? params.context?.auxData?.frameId;
            // translate Fetch.requestPaused networkId (which is what we use in other parts of the app
            requestId =
                this.fetchRequestIdToNetworkId.get(params.requestId) ??
                    params.networkId ??
                    params.requestId;
            if (params.networkId)
                this.fetchRequestIdToNetworkId.set(params.requestId, params.networkId);
            if (!pageId && params.targetInfo && params.targetInfo?.type === 'page') {
                pageId = params.targetInfo.targetId;
                event.pageTargetId = pageId;
            }
            if (!frameId && params.targetInfo && params.targetInfo?.type === 'iframe') {
                frameId = params.targetInfo.targetId;
            }
        }
        if (event.direction === 'send') {
            this.sentMessagesById[event.id] = {
                method: event.method,
                frameId,
                requestId,
            };
        }
        else if (event.id) {
            const sentMessage = this.sentMessagesById[event.id];
            delete this.sentMessagesById[event.id];
            if (sentMessage) {
                event.method = sentMessage.method;
                frameId ??= sentMessage.frameId;
                requestId ??= sentMessage.requestId;
            }
        }
        event.frameId = frameId;
        event.requestId = requestId;
        if (requestId && this.requestsToSkip.has(requestId))
            return;
        const method = event.method;
        const result = event.result;
        if (result) {
            if (this.truncateMessageResponses.has(method)) {
                let extras = '';
                if ('data' in result) {
                    extras = ` ${result.data.length} chars`;
                }
                event.result = { ...result, data: `[truncated${extras}]` };
            }
        }
        if (params) {
            const tuncaters = this.truncateParams.get(method);
            if (tuncaters) {
                event.params = { ...params };
                for (const truncPath of tuncaters) {
                    const { maxLength, path } = truncPath;
                    let value = params;
                    let propName = path;
                    let eventParent = event.params;
                    if (typeof path === 'string') {
                        value = value[path];
                    }
                    else {
                        for (let i = 0; i < path.length; i += 1) {
                            const part = path[i];
                            eventParent = value;
                            value = value[part];
                            propName = part;
                        }
                    }
                    if (value && typeof value === 'string' && value.length > maxLength) {
                        eventParent[propName] = `${value.substr(0, maxLength)}... [truncated ${value.length - maxLength} chars]`;
                    }
                    else if (value && typeof value !== 'string') {
                        eventParent[propName] = 'REMOVED FOR LOGS';
                    }
                }
            }
        }
        this.emit('devtools-message', event);
        this.logger.stats(`${event.direction}:${event.method}`, {
            pageId: event.pageTargetId,
            frameId: event.frameId,
            requestId: event.requestId,
            messageId: event.id,
            params: event.params,
            result: event.result,
            error: event.error,
            devtoolsSessionId: event.sessionId,
        });
    }
}
DevtoolsSessionLogger.defaultTruncateMessageResponses = new Set(['Page.captureScreenshot', 'Network.getResponseBody']);
DevtoolsSessionLogger.defaultTruncateParams = new Map([
    ['Fetch.fulfillRequest', [{ maxLength: 50, path: 'body' }]],
    ['Page.screencastFrame', [{ maxLength: 0, path: 'data' }]],
    ['Page.addScriptToEvaluateOnNewDocument', [{ maxLength: 50, path: 'source' }]],
    ['Runtime.bindingCalled', [{ maxLength: 250, path: 'payload' }]],
    ['Runtime.evaluate', [{ maxLength: 250, path: 'expression' }]],
    [
        'Network.requestWillBeSent',
        [
            { maxLength: 100, path: ['request', 'postData'] },
            { maxLength: 0, path: ['request', 'postDataEntries'] },
        ],
    ],
    ['Network.webSocketFrameSent', [{ maxLength: 50, path: 'payloadData' }]],
]);
exports.default = DevtoolsSessionLogger;
//# sourceMappingURL=DevtoolsSessionLogger.js.map