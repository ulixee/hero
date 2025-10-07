"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceState_1 = require("../interfaces/ResourceState");
class InterceptorHandler {
    static async shouldIntercept(ctx) {
        ctx.setState(ResourceState_1.default.InterceptHandler);
        const requestSession = ctx.requestSession;
        if (!requestSession)
            return false;
        if (requestSession.isClosing)
            return false;
        const shouldIntercept = await requestSession.willInterceptRequest(ctx.url, ctx.resourceType);
        if (!shouldIntercept)
            return false;
        ctx.didInterceptResource = shouldIntercept;
        if (ctx.proxyToClientResponse) {
            if (await requestSession.didHandleInterceptResponse(ctx, ctx.clientToProxyRequest, ctx.proxyToClientResponse)) {
                ctx.responseHeaders ??= ctx.proxyToClientResponse.getHeaders();
                ctx.responseTime ??= Date.now();
                ctx.status ??= ctx.proxyToClientResponse.statusCode;
                ctx.statusMessage ??= ctx.proxyToClientResponse.statusMessage;
                ctx.didInterceptResource = true;
                return true;
            }
            let contentType = 'text/html';
            if (ctx.resourceType === 'Image') {
                contentType = `image/${ctx.url.pathname.split('.').pop()}`;
            }
            ctx.proxyToClientResponse.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
            });
            ctx.proxyToClientResponse.end('');
        }
        // don't proceed
        return true;
    }
}
exports.default = InterceptorHandler;
//# sourceMappingURL=InterceptorHandler.js.map