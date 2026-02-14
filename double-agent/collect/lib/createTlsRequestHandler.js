"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createTlsRequestHandler;
const index_1 = require("@double-agent/config/index");
const extractRequestDetails_1 = require("./extractRequestDetails");
const RequestContext_1 = require("./RequestContext");
const DomainUtils_1 = require("./DomainUtils");
const { TlsDomain } = index_1.default.collect.domains;
function createTlsRequestHandler(server, serverContext) {
    return async function requestHandler(req, res) {
        const { sessionTracker } = serverContext;
        const requestUrl = server.getRequestUrl(req);
        if (!(0, DomainUtils_1.isRecognizedDomain)(req.headers.host, [TlsDomain])) {
            req.socket.destroy();
            console.warn('Invalid domain used to access site', req.url, req.headers.host);
            return;
        }
        const session = sessionTracker.getSessionFromServerRequest(server, req);
        sessionTracker.touchSession(session.id);
        const { requestDetails } = await (0, extractRequestDetails_1.default)(server, req, session);
        const ctx = new RequestContext_1.default(server, req, res, requestUrl, requestDetails, session);
        const handler = server.getHandlerFn(requestUrl.pathname);
        session.recordRequest(requestDetails);
        if (handler) {
            await handler(ctx);
        }
        else {
            res.writeHead(404).end(JSON.stringify({ message: 'Not found' }));
        }
    };
}
//# sourceMappingURL=createTlsRequestHandler.js.map