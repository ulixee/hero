"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainType = void 0;
exports.getDomainType = getDomainType;
exports.isRecognizedDomain = isRecognizedDomain;
exports.addSessionIdToUrl = addSessionIdToUrl;
exports.addPageIndexToUrl = addPageIndexToUrl;
exports.cleanDomains = cleanDomains;
const url_1 = require("url");
const index_1 = require("@double-agent/config/index");
const { CrossDomain, MainDomain, SubDomain, TlsDomain } = index_1.default.collect.domains;
var DomainType;
(function (DomainType) {
    DomainType["MainDomain"] = "MainDomain";
    DomainType["SubDomain"] = "SubDomain";
    DomainType["TlsDomain"] = "TlsDomain";
    DomainType["CrossDomain"] = "CrossDomain";
})(DomainType || (exports.DomainType = DomainType = {}));
function getDomainType(url) {
    const host = typeof url === 'string' ? url : url.host;
    const domain = extractDomainFromHost(host);
    if (domain === MainDomain || domain === DomainType.MainDomain.toLowerCase()) {
        return DomainType.MainDomain;
    }
    if (domain === CrossDomain || domain === DomainType.CrossDomain.toLowerCase()) {
        return DomainType.CrossDomain;
    }
    if (domain === SubDomain || domain === DomainType.SubDomain.toLowerCase()) {
        return DomainType.SubDomain;
    }
    if (domain === TlsDomain || domain === DomainType.TlsDomain.toLowerCase()) {
        return DomainType.TlsDomain;
    }
    throw new Error(`Unknown domain type: ${domain}`);
}
function isRecognizedDomain(host, recognizedDomains) {
    const domain = extractDomainFromHost(host);
    return recognizedDomains.some((x) => x === domain);
}
function addSessionIdToUrl(url, sessionId) {
    if (!url)
        return url;
    const startUrl = new url_1.URL(url);
    startUrl.searchParams.set('sessionId', sessionId);
    return startUrl.href;
}
function addPageIndexToUrl(url, pageIndex) {
    if (!url)
        return url;
    const startUrl = new url_1.URL(url);
    startUrl.searchParams.set('pageIndex', pageIndex.toString());
    return startUrl.href;
}
function cleanDomains(url) {
    if (!url)
        return url;
    return url
        .replace(RegExp(SubDomain, 'g'), 'SubDomain')
        .replace(RegExp(MainDomain, 'g'), 'MainDomain')
        .replace(RegExp(CrossDomain, 'g'), 'CrossDomain');
}
function extractDomainFromHost(host) {
    return host.split(':')[0];
}
//# sourceMappingURL=DomainUtils.js.map