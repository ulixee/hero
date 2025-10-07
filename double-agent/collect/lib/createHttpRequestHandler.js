"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createHttpRequestHandler;
const fs = require("fs");
const index_1 = require("@double-agent/config/index");
const extractRequestDetails_1 = require("./extractRequestDetails");
const RequestContext_1 = require("./RequestContext");
const DomainUtils_1 = require("./DomainUtils");
const { CrossDomain, MainDomain, SubDomain } = index_1.default.collect.domains;
function createHttpRequestHandler(server, serverContext) {
    return async function requestHandler(req, res) {
        if (req.method === 'HEAD') {
            // BrowserStack sends head requests to check if a domain is active. not part of the tests..
            console.log('HEAD request inbound. Should not be getting this.', String(req.url).replace(/\n|\r/g, ''), String(req.headers).replace(/\n|\r/g, ''));
            res.end();
            return;
        }
        const { sessionTracker } = serverContext;
        const requestUrl = server.getRequestUrl(req);
        const route = server.getRoute(requestUrl.pathname);
        if (!(0, DomainUtils_1.isRecognizedDomain)(requestUrl.host, [MainDomain, SubDomain, CrossDomain])) {
            req.socket.destroy();
            console.warn('Invalid domain used to access site', String(req.url).replace(/\n|\r/g, ''), String(req.headers.host).replace(/\n|\r/g, ''));
            return;
        }
        if (requestUrl.pathname === '/favicon.ico') {
            return sendFavicon(res);
        }
        if (route?.isAsset) {
            await route?.handlerFn({ res });
            return;
        }
        try {
            const sessionId = sessionTracker.getSessionIdFromServerRequest(server, req);
            const session = sessionTracker.getSession(sessionId);
            if (!session) {
                throw new Error(`Missing session: ${sessionId}`);
            }
            const { requestDetails } = await (0, extractRequestDetails_1.default)(server, req, session);
            const ctx = new RequestContext_1.default(server, req, res, requestUrl, requestDetails, session);
            const userAgentId = session.userAgentId;
            session.recordRequest(requestDetails);
            console.log(userAgentId, req.headers['user-agent']);
            console.log('%s %s: from %s (%s)', requestDetails.method, requestDetails.url, requestDetails.remoteAddress, userAgentId);
            if (req.method === 'OPTIONS') {
                sendPreflight(ctx);
                if (route?.preflightHandlerFn)
                    await route?.preflightHandlerFn(ctx);
            }
            else if (route?.handlerFn) {
                await route?.handlerFn(ctx);
            }
            else {
                res.writeHead(404).end(JSON.stringify({ message: 'Not found' }));
            }
        }
        catch (err) {
            console.log('Request error %s %s', req.method, String(req.url).replace(/\n|\r/g, ''), err);
            res.writeHead(500, err.message).end();
        }
    };
}
function sendPreflight(ctx) {
    let origin = ctx.req.headers.origin;
    // set explicit domain to deal with strict origin
    if (origin === 'null') {
        origin = `http${ctx.requestDetails.secureDomain ? 's' : ''}://${ctx.req.headers.host}`;
    }
    ctx.res.writeHead(204, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': ctx.req.headers['access-control-request-headers'] ?? '',
        'Content-Length': 0,
        Vary: 'Origin',
    });
    ctx.res.end('');
}
let favicon;
function sendFavicon(res) {
    favicon ??= fs.readFileSync(`${__dirname}/../public/favicon.ico`);
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end(favicon);
}
//# sourceMappingURL=createHttpRequestHandler.js.map