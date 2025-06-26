"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResourceState;
(function (ResourceState) {
    ResourceState["ClientToProxyRequest"] = "ClientToProxyRequest";
    ResourceState["InterceptHandler"] = "InterceptHandler";
    ResourceState["DetermineResourceType"] = "DetermineResourceType";
    ResourceState["EmulationWillSendResponse"] = "EmulationWillSendResponse";
    ResourceState["CheckCacheOnRequest"] = "CheckCacheOnRequest";
    ResourceState["GetSocket"] = "GetSocket";
    ResourceState["BeforeSendRequest"] = "BeforeSendRequest";
    ResourceState["CreateH2Session"] = "CreateH2Session";
    ResourceState["CreateProxyToServerRequest"] = "CreateProxyToServerRequest";
    ResourceState["ServerToProxyPush"] = "ServerToProxyPush";
    ResourceState["ProxyToClientPush"] = "ProxyToClientPush";
    ResourceState["WriteProxyToServerRequestBody"] = "WriteProxyToServerRequestBody";
    ResourceState["ServerToProxyOnResponse"] = "ServerToProxyOnResponse";
    ResourceState["ProxyToClientPushResponse"] = "ProxyToClientPushResponse";
    ResourceState["ServerToProxyPushResponse"] = "ServerToProxyPushResponse";
    ResourceState["CheckCacheOnResponseEnd"] = "CheckCacheOnResponseEnd";
    ResourceState["WriteProxyToClientResponseBody"] = "WriteProxyToClientResponseBody";
    ResourceState["End"] = "End";
    ResourceState["SessionClosed"] = "SessionClosed";
    ResourceState["PrematurelyClosed"] = "PrematurelyClosed";
    ResourceState["Intercepted"] = "Intercepted";
    ResourceState["Error"] = "Error";
})(ResourceState || (ResourceState = {}));
exports.default = ResourceState;
//# sourceMappingURL=ResourceState.js.map