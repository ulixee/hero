"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceType = void 0;
exports.getResourceTypeForChromeValue = getResourceTypeForChromeValue;
var ResourceType;
(function (ResourceType) {
    ResourceType["Document"] = "Document";
    ResourceType["Stylesheet"] = "Stylesheet";
    ResourceType["Image"] = "Image";
    ResourceType["Media"] = "Media";
    ResourceType["Font"] = "Font";
    ResourceType["Script"] = "Script";
    ResourceType["TextTrack"] = "TextTrack";
    ResourceType["XHR"] = "XHR";
    ResourceType["Fetch"] = "Fetch";
    ResourceType["EventSource"] = "EventSource";
    ResourceType["Websocket"] = "Websocket";
    ResourceType["Manifest"] = "Manifest";
    ResourceType["SignedExchange"] = "SignedExchange";
    ResourceType["Ping"] = "Ping";
    ResourceType["CSPViolationReport"] = "CSPViolationReport";
    ResourceType["Redirect"] = "Redirect";
    ResourceType["Ico"] = "Ico";
    ResourceType["Preflight"] = "Preflight";
    ResourceType["Other"] = "Other";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
function getResourceTypeForChromeValue(resourceType, method) {
    if (method === 'OPTIONS')
        return 'Preflight';
    return resourceType;
}
//# sourceMappingURL=IResourceType.js.map