"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Fs = require("fs");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const Utils_1 = require("@double-agent/analyze/lib/headers/Utils");
class HeadersJson {
    constructor(config, userAgentIds) {
        this.data = {};
        this.browserId = config.browserId;
        for (const userAgentId of userAgentIds) {
            const profile = unblocked_browser_profiler_1.default.getProfile('http-basic-headers', userAgentId);
            this.processResources(profile.data);
            const ws = unblocked_browser_profiler_1.default.getProfile('http-websockets', userAgentId);
            this.processResources(ws.data);
            const xhr = unblocked_browser_profiler_1.default.getProfile('http-xhr', userAgentId);
            this.processResources(xhr.data);
            const assets = unblocked_browser_profiler_1.default.getProfile('http-assets', userAgentId);
            this.processResources(assets.data);
        }
    }
    save(dataDir) {
        if (!Fs.existsSync(dataDir))
            Fs.mkdirSync(dataDir, { recursive: true });
        const dataString = JSON.stringify(this.data, null, 2);
        Fs.writeFileSync(`${dataDir}/headers.json`, `${dataString}\n`);
    }
    processResources(data) {
        for (const entry of data) {
            const defaultKeys = entry.rawHeaders
                .filter(x => (0, Utils_1.isOfficialHeader)(x[0].toLowerCase()))
                .map(x => x[0]);
            const { resourceType, protocol } = entry;
            if (!this.data[protocol])
                this.data[protocol] = {};
            const protocolResources = this.data[protocol];
            if (!protocolResources[resourceType])
                protocolResources[resourceType] = [];
            const resourceList = protocolResources[resourceType];
            const defaults = {};
            for (const key of defaultKeys) {
                if ((0, Utils_1.isOfficialDefaultValueKey)(key)) {
                    const rawHeader = entry.rawHeaders.find(x => x[0] === key);
                    if (rawHeader) {
                        defaults[key] = defaults[key] || [];
                        defaults[key].push(rawHeader[1]);
                    }
                }
            }
            const existing = resourceList.find(x => x.method === entry.method && x.isRedirect === entry.isRedirect && x.order.toString() === defaultKeys.toString());
            if (!existing) {
                resourceList.push({
                    originTypes: [entry.originType],
                    method: entry.method,
                    isRedirect: entry.isRedirect,
                    order: defaultKeys,
                    defaults,
                });
            }
            else {
                if (!existing.originTypes.includes(entry.originType)) {
                    existing.originTypes.push(entry.originType);
                }
                for (const [key, value] of Object.entries(defaults)) {
                    if (!existing.defaults[key])
                        existing.defaults[key] = [];
                    if (!existing.defaults[key].includes(value[0])) {
                        existing.defaults[key].push(value[0]);
                    }
                }
            }
        }
    }
}
exports.default = HeadersJson;
//# sourceMappingURL=Headers.js.map