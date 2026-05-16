"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ReadableCookieCheck_1 = require("./checks/ReadableCookieCheck");
const UnreadableCookieCheck_1 = require("./checks/UnreadableCookieCheck");
const optionalCheckSignatures = require("./optionalCheckSignatures.json");
class CheckGenerator {
    constructor(profile) {
        this.checks = [];
        this.profile = profile;
        this.extractChecks();
    }
    extractChecks() {
        const { userAgentId } = this.profile;
        const setCookiesMap = this.extractSetCookieDetails();
        const getCookiesMap = {};
        for (const cookieData of this.profile.data) {
            const { group, getter, httpProtocol, cookies } = cookieData;
            if (!getter)
                continue;
            const key = `${httpProtocol}-${group}`;
            if (!setCookiesMap[key])
                throw new Error(`no cookies created for ${key}`);
            getCookiesMap[key] = getCookiesMap[key] || {};
            getCookiesMap[key][getter] = getCookiesMap[key][getter] || new Set();
            for (const name of Object.keys(cookies)) {
                const setDetails = setCookiesMap[key][name];
                const getDetails = { getter, httpProtocol };
                if (!setDetails)
                    throw new Error(`no cookies created for ${key} with name: ${name}`);
                this.addCheck(new ReadableCookieCheck_1.default({ userAgentId }, { path: name }, setDetails, getDetails));
                getCookiesMap[key][getter].add(name);
            }
        }
        for (const [key, cookiesByName] of Object.entries(setCookiesMap)) {
            for (const [name, setDetails] of Object.entries(cookiesByName)) {
                for (const [getter, names] of Object.entries(getCookiesMap[key])) {
                    if (names.has(name))
                        continue;
                    const httpProtocol = key.split('-')[0];
                    const getDetails = { getter, httpProtocol };
                    this.addCheck(new UnreadableCookieCheck_1.default({ userAgentId }, { path: name }, setDetails, getDetails));
                }
            }
        }
    }
    extractSetCookieDetails() {
        const cookiesMap = {};
        for (const cookieData of this.profile.data) {
            const { group, setter, httpProtocol, cookies } = cookieData;
            const key = `${httpProtocol}-${group}`;
            if (!setter)
                continue;
            cookiesMap[key] = cookiesMap[key] || {};
            for (const createCookieStr of cookies) {
                const parts = createCookieStr.split(';').map((x) => x.trim());
                const name = parts.splice(0, 1)[0].split('=')[0];
                const previouslyCreated = !!cookiesMap[key][name];
                const attributes = parts
                    .map((part) => {
                    // eslint-disable-next-line prefer-const
                    let [n, v] = part.split('=');
                    if (n === 'expires')
                        v = '[PAST DATE]';
                    return v ? [n, v].join('=') : n;
                })
                    .filter((x) => x);
                cookiesMap[key][name] = {
                    setter,
                    name,
                    previouslyCreated,
                    attributes,
                };
            }
        }
        return cookiesMap;
    }
    addCheck(check) {
        const browserId = this.profile.userAgentId.split('--')[1];
        if (optionalCheckSignatures[browserId] &&
            optionalCheckSignatures[browserId].includes(check.signature))
            return;
        this.checks.push(check);
    }
}
exports.default = CheckGenerator;
//# sourceMappingURL=CheckGenerator.js.map