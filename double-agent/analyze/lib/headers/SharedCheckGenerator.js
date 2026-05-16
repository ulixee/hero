"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractOrderIndexMapFromArrays = extractOrderIndexMapFromArrays;
const DefaultValueCheck_1 = require("../checks/DefaultValueCheck");
const StringCaseCheck_1 = require("../checks/StringCaseCheck");
const ArrayOrderIndexCheck_1 = require("../checks/ArrayOrderIndexCheck");
const Utils_1 = require("./Utils");
class SharedCheckGenerator {
    constructor(userAgentId, data) {
        this.userAgentId = userAgentId;
        this.data = data;
    }
    createDefaultValueChecks() {
        const defaultValuesMap = {};
        const checks = [];
        for (const page of this.data) {
            const { protocol, method: httpMethod, resourceType } = page;
            // Preflight default values vary based on the headers and other attributes of the Xhr
            defaultValuesMap[protocol] ??= {};
            defaultValuesMap[protocol][httpMethod] ??= {};
            defaultValuesMap[protocol][httpMethod][resourceType] ??= {};
            const resourceValues = defaultValuesMap[protocol][httpMethod][resourceType];
            for (const [key, value] of page.rawHeaders) {
                if (!(0, Utils_1.isOfficialDefaultValueKey)(key))
                    continue;
                const lowerKey = key.toLowerCase();
                resourceValues[lowerKey] ??= new Set();
                resourceValues[lowerKey].add(value);
            }
        }
        for (const [protocol, methods] of Object.entries(defaultValuesMap)) {
            for (const [httpMethod, resources] of Object.entries(methods)) {
                for (const [resourceType, valuesByKey] of Object.entries(resources)) {
                    for (const [key, values] of Object.entries(valuesByKey)) {
                        const path = `${resourceType}:${key}`;
                        const meta = { path, protocol, httpMethod };
                        const check = new DefaultValueCheck_1.default({ userAgentId: this.userAgentId }, meta, Array.from(values));
                        checks.push(check);
                    }
                }
            }
        }
        return checks;
    }
    createHeaderCaseChecks(...includeHeaders) {
        const checks = [];
        for (const page of this.data) {
            const { protocol, method: httpMethod } = page;
            for (const [key] of page.rawHeaders) {
                if (!(0, Utils_1.isOfficialHeader)(key) && !includeHeaders.includes(key.toLowerCase()))
                    continue;
                const path = `${key.toLowerCase()}`;
                const meta = { path, protocol, httpMethod };
                const check = new StringCaseCheck_1.default({ userAgentId: this.userAgentId }, meta, key);
                checks.push(check);
            }
        }
        return checks;
    }
    createHeaderOrderChecks(...excludeHeaders) {
        const checks = [];
        const headerKeysMap = {};
        for (const page of this.data) {
            const { protocol, method: httpMethod, originType, resourceType, isRedirect } = page;
            const keys = page.rawHeaders
                .map(x => x[0].toLowerCase())
                .filter(Utils_1.isOfficialHeader)
                .filter(x => !excludeHeaders.includes(x));
            if (!keys.length)
                continue;
            const withCookie = keys.includes('cookie') ? 'cookie' : 'nocookie';
            const resourceKey = `${originType}:${resourceType}:${isRedirect ? 'redirect' : 'direct'}:${withCookie}`;
            headerKeysMap[protocol] ??= {};
            headerKeysMap[protocol][httpMethod] ??= {};
            headerKeysMap[protocol][httpMethod][resourceKey] ??= [];
            const entries = headerKeysMap[protocol][httpMethod][resourceKey];
            if (!entries.some(x => x.toString() === keys.toString())) {
                entries.push(keys);
            }
        }
        for (const protocol of Object.keys(headerKeysMap)) {
            for (const [httpMethod, resourceKeys] of Object.entries(headerKeysMap[protocol])) {
                for (const [resourceKey, headerKeys] of Object.entries(resourceKeys)) {
                    const orderIndexMap = extractOrderIndexMapFromArrays(headerKeys);
                    for (const key of Object.keys(orderIndexMap)) {
                        const orderIndex = orderIndexMap[key];
                        const path = `headers:${resourceKey}:${key}`;
                        const meta = { path, protocol, httpMethod };
                        const check = new ArrayOrderIndexCheck_1.default({ userAgentId: this.userAgentId }, meta, orderIndex);
                        checks.push(check);
                    }
                }
            }
        }
        return checks;
    }
}
exports.default = SharedCheckGenerator;
function extractOrderIndexMapFromArrays(arrays) {
    const tmpIndex = {};
    const finalIndex = {};
    for (const array of arrays) {
        array.forEach((key, i) => {
            tmpIndex[key] = tmpIndex[key] || { prev: new Set(), next: new Set() };
            array.slice(0, i).forEach(prev => tmpIndex[key].prev.add(prev));
            array.slice(i + 1).forEach(next => tmpIndex[key].next.add(next));
            finalIndex[key] = finalIndex[key] || [[], []];
            finalIndex[key][0] = Array.from(tmpIndex[key].prev);
            finalIndex[key][1] = Array.from(tmpIndex[key].next);
        });
    }
    return finalIndex;
}
//# sourceMappingURL=SharedCheckGenerator.js.map