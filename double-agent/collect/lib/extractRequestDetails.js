"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = extractRequestDetails;
exports.getResourceType = getResourceType;
exports.getOriginType = getOriginType;
const url_1 = require("url");
const cookie = require("cookie");
const ResourceType_1 = require("../interfaces/ResourceType");
const OriginType_1 = require("../interfaces/OriginType");
const DomainUtils_1 = require("./DomainUtils");
async function extractRequestDetails(server, req, session, overrideResourceType) {
    const time = new Date();
    const userAgentString = req.headers['user-agent'];
    const addr = `${req.socket.remoteAddress.split(':').pop()}:${req.socket.remotePort}`;
    const requestUrl = server.getRequestUrl(req);
    let body = '';
    let bodyJson = {};
    for await (const chunk of req) {
        body += chunk.toString();
    }
    if (req.headers['content-type'] === 'application/json') {
        bodyJson = JSON.parse(body);
    }
    const cookies = cookie.parse(req.headers.cookie ?? '');
    const rawHeaders = parseHeaders(req.rawHeaders);
    const requestDetails = {
        userAgentString,
        bodyJson,
        cookies,
        time,
        remoteAddress: addr,
        url: cleanUrl(requestUrl.href, session.id),
        origin: cleanUrl(req.headers.origin, session.id),
        originType: OriginType_1.default.None,
        referer: cleanUrl(req.headers.referer, session.id),
        method: req.method,
        headers: rawHeaders.map((x) => cleanUrl(x, session.id)),
        domainType: (0, DomainUtils_1.getDomainType)(requestUrl),
        secureDomain: ['https', 'tls', 'http2'].includes(server.protocol),
        resourceType: overrideResourceType ?? getResourceType(req.method, requestUrl.pathname),
    };
    // if origin sent, translate into origin type
    if (requestDetails.origin && requestDetails.origin !== 'null') {
        requestDetails.originType = getOriginType(new url_1.URL(requestDetails.origin), requestDetails.domainType);
    }
    else if (requestDetails.referer) {
        requestDetails.originType = getOriginType(new url_1.URL(requestDetails.referer), requestDetails.domainType);
    }
    return {
        requestDetails,
        requestUrl,
    };
}
function getResourceType(httpMethod, pathname) {
    if (httpMethod === 'OPTIONS') {
        return ResourceType_1.default.Preflight;
    }
    if (pathname.endsWith('.map')) {
        return ResourceType_1.default.Other;
    }
    if (pathname.endsWith('worker.js')) {
        return ResourceType_1.default.Other;
    }
    if (pathname.endsWith('.js')) {
        return ResourceType_1.default.Script;
    }
    if (pathname.endsWith('.css')) {
        return ResourceType_1.default.Stylesheet;
    }
    if (pathname.endsWith('.png') || pathname.endsWith('.svg')) {
        return ResourceType_1.default.Image;
    }
    if (pathname.endsWith('.ico')) {
        return ResourceType_1.default.Ico;
    }
    if (pathname.endsWith('.mp3') || pathname.endsWith('.webm')) {
        return ResourceType_1.default.Media;
    }
    if (pathname.endsWith('.ttf') ||
        pathname.endsWith('.woff2') ||
        pathname.endsWith('.woff') ||
        pathname.endsWith('.otf')) {
        return ResourceType_1.default.Font;
    }
    if (pathname.includes('fetch')) {
        return ResourceType_1.default.Fetch;
    }
    if (pathname.includes('axios') || pathname.endsWith('.json')) {
        return ResourceType_1.default.XHR;
    }
    return ResourceType_1.default.Document;
}
function getOriginType(referer, hostDomainType) {
    if (!referer)
        return OriginType_1.default.None;
    const refererDomainType = (0, DomainUtils_1.getDomainType)(referer);
    if (hostDomainType === refererDomainType) {
        return OriginType_1.default.SameOrigin;
    }
    if (hostDomainType === DomainUtils_1.DomainType.SubDomain && refererDomainType === DomainUtils_1.DomainType.MainDomain) {
        return OriginType_1.default.SameSite;
    }
    if (hostDomainType === DomainUtils_1.DomainType.MainDomain && refererDomainType === DomainUtils_1.DomainType.SubDomain) {
        return OriginType_1.default.SameSite;
    }
    return OriginType_1.default.CrossSite;
}
function parseHeaders(rawHeaders) {
    const headers = rawHeaders;
    const headerPrintout = [];
    for (let i = 0; i < headers.length; i += 2) {
        const key = headers[i];
        const value = headers[i + 1];
        headerPrintout.push(`${key}=${value}`);
    }
    return headerPrintout;
}
function cleanUrl(url, sessionId) {
    if (!url)
        return url;
    return (0, DomainUtils_1.cleanDomains)(url)
        .replace(RegExp(`sessionId=${sessionId}`, 'g'), 'sessionId=X')
        .replace(/:[0-9]+\//, '/');
}
//# sourceMappingURL=extractRequestDetails.js.map