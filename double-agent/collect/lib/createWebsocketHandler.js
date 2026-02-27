"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createWebsocketHandler;
const WebSocket = require("ws");
const ResourceType_1 = require("../interfaces/ResourceType");
const extractRequestDetails_1 = require("./extractRequestDetails");
const RequestContext_1 = require("./RequestContext");
function createWebsocketHandler(server, detectionContext) {
    const wss = new WebSocket.Server({ clientTracking: false, noServer: true });
    return async function websocketHandler(req, socket, head) {
        const { sessionTracker } = detectionContext;
        const session = sessionTracker.getSessionFromServerRequest(server, req);
        sessionTracker.touchSession(session.id);
        const { requestDetails, requestUrl } = await (0, extractRequestDetails_1.default)(server, req, session, ResourceType_1.default.WebsocketUpgrade);
        const ctx = new RequestContext_1.default(server, req, null, requestUrl, requestDetails, session);
        const userAgentId = ctx.session.userAgentId;
        session.recordRequest(requestDetails);
        console.log('%s %s: from %s (%s)', 'WS', requestDetails.url, requestDetails.remoteAddress, userAgentId);
        const handlerFn = server.getHandlerFn(requestUrl.pathname);
        wss.handleUpgrade(req, socket, head, async (ws) => {
            if (handlerFn) {
                await handlerFn(ctx);
            }
            ws.on('message', async (message) => {
                console.log(`WS: Received message ${message} on ${req.headers.host}`);
                ws.send('back at you');
            });
        });
    };
}
//# sourceMappingURL=createWebsocketHandler.js.map