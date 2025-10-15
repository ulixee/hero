"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SharedCheckGenerator_1 = require("@double-agent/analyze/lib/headers/SharedCheckGenerator");
const NumberCheck_1 = require("@double-agent/analyze/lib/checks/NumberCheck");
class CheckGenerator {
    constructor(profile) {
        this.checks = [];
        this.profile = profile;
        const { userAgentId, data } = profile;
        this.userAgentId = userAgentId;
        this.checks.push(...this.getPreflightCountChecks());
        const checks = new SharedCheckGenerator_1.default(userAgentId, data);
        this.checks.push(...checks.createHeaderCaseChecks('x-lower-sessionid', 'x-header-sessionid'), 
        // XHR have all kinds of order changes. For now, we're just going to remove anything that moves
        ...checks.createHeaderOrderChecks('sec-ch-ua', 'sec-ua-mobile', 'sec-fetch-mode', 'sec-fetch-dest', 'user-agent', 'accept', 'content-type', 'content-length'), // content-type location varies in the headers
        ...checks.createDefaultValueChecks());
    }
    getPreflightCountChecks() {
        const { data } = this.profile;
        const preflightsByOrigin = {};
        const origins = new Set();
        for (const page of data) {
            origins.add(page.originType);
        }
        for (const origin of origins) {
            preflightsByOrigin[origin] = {
                GET: {
                    http: 0,
                    https: 0,
                    http2: 0,
                },
                POST: {
                    http: 0,
                    https: 0,
                    http2: 0,
                },
            };
        }
        for (const page of data) {
            const { protocol, method: httpMethod, originType } = page;
            if (httpMethod === 'OPTIONS') {
                const sourceRequest = data.find(x => x.pathname === page.pathname && x.protocol === protocol && x.method !== httpMethod);
                if (sourceRequest)
                    preflightsByOrigin[originType][sourceRequest.method][protocol] += 1;
            }
        }
        const checks = [];
        for (const [originType, methods] of Object.entries(preflightsByOrigin)) {
            for (const [httpMethod, protocols] of Object.entries(methods)) {
                for (const [protocol, preflights] of Object.entries(protocols)) {
                    const path = `${originType}:preflightRequests`;
                    const check = new NumberCheck_1.default({ userAgentId: this.userAgentId }, { httpMethod, protocol, path }, preflights);
                    checks.push(check);
                }
            }
        }
        return checks;
    }
}
exports.default = CheckGenerator;
//# sourceMappingURL=CheckGenerator.js.map