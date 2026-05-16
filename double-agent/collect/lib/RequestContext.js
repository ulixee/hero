"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const index_1 = require("@double-agent/config/index");
const DomainUtils_1 = require("./DomainUtils");
class RequestContext {
    constructor(server, req, res, url, requestDetails, session) {
        this.server = server;
        this.req = req;
        this.res = res;
        this.url = url;
        this.requestDetails = requestDetails;
        this.session = session;
        this.plugin = server.plugin;
        const pageIndexStr = url.searchParams.get('pageIndex');
        if (pageIndexStr) {
            const pages = this.plugin.pagesByAssignmentType[this.session.assignmentType];
            const pageIndex = Number(pageIndexStr);
            this.currentPageIndex = pageIndex;
            this.nextPageIndex = pageIndex + 1;
            if (this.nextPageIndex >= pages.length)
                this.nextPageIndex = undefined;
            this.session.trackCurrentPageIndex(this.plugin.id, this.currentPageIndex);
        }
    }
    get page() {
        return this.plugin.pagesByAssignmentType[this.session.assignmentType][this.currentPageIndex];
    }
    get nextPageLink() {
        if (this.nextPageIndex === undefined)
            return;
        const pageIndex = this.nextPageIndex;
        const page = this.plugin.pagesByAssignmentType[this.session.assignmentType][pageIndex];
        return this.plugin.convertToSessionPage(page, this.session.id, pageIndex).url;
    }
    buildUrl(path, domainType, protocol) {
        domainType = domainType || this.requestDetails.domainType;
        protocol = protocol || this.server.protocol;
        const { port, plugin } = this.plugin.getServer(protocol, this.session.id, this.server.protocol);
        const { CrossDomain, MainDomain, SubDomain } = index_1.default.collect.domains;
        let domain;
        if (domainType === DomainUtils_1.DomainType.SubDomain) {
            domain = SubDomain;
        }
        else if (domainType === DomainUtils_1.DomainType.CrossDomain) {
            domain = CrossDomain;
        }
        else if (domainType === DomainUtils_1.DomainType.MainDomain) {
            domain = MainDomain;
        }
        else {
            throw new Error(`Unknown domainType: ${domainType}`);
        }
        if (protocol === 'http2') {
            protocol = 'https';
        }
        const baseUrl = `${protocol}://${domain}:${port}`;
        const fullPath = `/${plugin.id}${path.startsWith('/') ? path : `/${path}`}`;
        const url = new url_1.URL(fullPath, baseUrl);
        if (domain === this.url.origin) {
            return [url.pathname, url.search].filter(Boolean).join('');
        }
        return (0, DomainUtils_1.addSessionIdToUrl)(url.href, this.session.id);
    }
}
exports.default = RequestContext;
//# sourceMappingURL=RequestContext.js.map