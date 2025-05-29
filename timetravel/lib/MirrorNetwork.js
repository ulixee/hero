"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bufferUtils_1 = require("@ulixee/commons/lib/bufferUtils");
const utils_1 = require("@ulixee/commons/lib/utils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const ResourcesTable_1 = require("@ulixee/hero-core/models/ResourcesTable");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
class MirrorNetwork {
    constructor(config) {
        this.resourceLookup = {};
        this.waitForPendingResources = new Set();
        this.doctypesByUrl = {};
        this.headersFilter = config.headersFilter ?? [];
        this.ignoreJavascriptRequests = config.ignoreJavascriptRequests ?? false;
        this.useResourcesOnce = config.useResourcesOnce ?? false;
        this.loadResourceDetails = config.loadResourceDetails;
        (0, utils_1.bindFunctions)(this);
    }
    registerDoctype(url, doctype) {
        this.doctypesByUrl[url] = doctype;
    }
    close() {
        this.resourceLookup = {};
        this.loadResourceDetails = null;
    }
    async mirrorNetworkRequests(request) {
        const { url, method } = request.request;
        if (request.resourceType === 'Document' || url === 'about:blank') {
            const doctype = this.doctypesByUrl[url] ?? '';
            return {
                requestId: request.requestId,
                responseCode: 200,
                responseHeaders: [
                    { name: 'Content-Type', value: 'text/html; charset=utf-8' },
                    { name: 'Content-Security-Policy', value: "script-src 'nonce-hero-timetravel'; connect-src 'self'" },
                    { name: 'Access-Control-Allow-Origin', value: '*' },
                ],
                body: Buffer.from(`${doctype}<html><head></head><body></body></html>`).toString('base64'),
            };
        }
        const key = `${method}_${url}`;
        const matches = this.resourceLookup[key];
        if (!matches?.length) {
            return {
                requestId: request.requestId,
                responseCode: 404,
                body: Buffer.from(`Not Found`).toString('base64'),
            };
        }
        let match = matches[0];
        if (!match.hasResponse && match.responsePromise) {
            const responsePromise = match.responsePromise.promise;
            this.waitForPendingResources.add(responsePromise);
            match = await responsePromise;
            this.waitForPendingResources.delete(responsePromise);
        }
        if (this.useResourcesOnce) {
            matches.shift();
        }
        if (this.ignoreJavascriptRequests &&
            (request.resourceType === 'Script' ||
                matches[0].contentType.includes('json') ||
                matches[0].contentType.includes('javascript'))) {
            return {
                requestId: request.requestId,
                responseCode: 200,
                responseHeaders: [{ name: 'Content-Type', value: matches[0].contentType }],
                body: '',
            };
        }
        const resource = await this.loadResourceDetails(match.id);
        const { headers, contentEncoding, isJavascript } = this.getMockHeaders(resource);
        if (this.ignoreJavascriptRequests && isJavascript) {
            return {
                requestId: request.requestId,
                responseCode: 200,
                responseHeaders: [{ name: 'Content-Type', value: matches[0].contentType }],
                body: '',
            };
        }
        let body = resource.body;
        // Chrome Devtools has an upstream issue that gzipped responses don't work, so we have to do it.. :(
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1138839
        if (contentEncoding) {
            body = await (0, bufferUtils_1.decompressBuffer)(resource.body, contentEncoding);
            headers.splice(headers.findIndex(x => x.name === 'content-encoding'), 1);
        }
        return {
            requestId: request.requestId,
            body: body?.toString('base64') ?? '',
            responseHeaders: headers,
            responseCode: resource.statusCode,
        };
    }
    addRequestedResource(resource) {
        const key = `${resource.method}_${resource.url}`;
        if (this.resourceLookup[key]?.length)
            return;
        resource.responsePromise = new Resolvable_1.default();
        this.resourceLookup[key] = [resource];
    }
    addResource(resource) {
        const key = `${resource.method}_${resource.url}`;
        if (this.resourceFilter) {
            if (this.resourceFilter.hasResponse && !resource.hasResponse) {
                return;
            }
            if (this.resourceFilter.isGetOrDocument &&
                !(resource.type === 'Document' || resource.method === 'GET')) {
                return;
            }
        }
        if (!this.resourceLookup[key]?.length) {
            this.resourceLookup[key] = [resource];
        }
        else {
            const pendingResolutionIdx = this.resourceLookup[key].findIndex(x => !!x.responsePromise && !x.responsePromise.isResolved);
            if (pendingResolutionIdx >= 0) {
                this.resourceLookup[key][pendingResolutionIdx].responsePromise.resolve(resource);
                this.resourceLookup[key][pendingResolutionIdx] = resource;
            }
            else {
                this.resourceLookup[key].push(resource);
            }
        }
    }
    setResources(resources, loadDetails) {
        this.loadResourceDetails = loadDetails;
        for (const resourceSet of Object.values(this.resourceLookup)) {
            for (const resource of resourceSet) {
                if (resource.responsePromise && !resource.responsePromise.isResolved)
                    resource.responsePromise.reject(new IPendingWaitEvent_1.CanceledPromiseError('Replacing resources'), true);
            }
        }
        this.resourceLookup = {};
        for (let resource of resources) {
            if (!resource.method) {
                resource = ResourcesTable_1.default.toResourceSummary(resource);
            }
            resource = resource;
            this.addResource(resource);
        }
    }
    getMockHeaders(resource) {
        const headers = [];
        let isJavascript = false;
        let contentEncoding;
        let hasChunkedTransfer = false;
        for (const [key, header] of Object.entries(resource.headers)) {
            const name = key.toLowerCase();
            for (const entry of this.headersFilter) {
                if (name.match(entry))
                    continue;
            }
            if (name === 'content-encoding') {
                contentEncoding = header;
            }
            if (name === 'transfer-encoding' && header === 'chunked') {
                // node has stripped this out by the time we have the body
                hasChunkedTransfer = true;
                continue;
            }
            if (name === 'content-type' && header.includes('javascript')) {
                isJavascript = true;
                break;
            }
            if (Array.isArray(header)) {
                for (const value of header) {
                    headers.push({ name, value });
                }
            }
            else {
                headers.push({ name, value: header });
            }
        }
        return { headers, isJavascript, contentEncoding, hasChunkedTransfer };
    }
    static createFromSessionDb(db, tabId, options = {
        hasResponse: true,
        isGetOrDocument: true,
    }) {
        options.loadResourceDetails ??= MirrorNetwork.loadResourceFromDb.bind(this, db);
        const network = new MirrorNetwork(options);
        const resources = db.resources.filter(options).filter(x => {
            if (tabId)
                return x.tabId === tabId;
            return true;
        });
        network.resourceFilter = options;
        network.setResources(resources, options.loadResourceDetails);
        return network;
    }
    static loadResourceFromDb(db, resourceId) {
        const resource = db.resources.getResponse(resourceId);
        const headers = JSON.parse(resource.responseHeaders ?? '{}');
        return {
            statusCode: resource.statusCode,
            headers,
            body: resource.responseData,
        };
    }
}
exports.default = MirrorNetwork;
//# sourceMappingURL=MirrorNetwork.js.map