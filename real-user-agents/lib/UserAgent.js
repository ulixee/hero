"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const paths_1 = require("./paths");
const Browsers_1 = require("./Browsers");
const OperatingSystems_1 = require("./OperatingSystems");
class UserAgent {
    constructor(entry) {
        const { id, pattern, operatingSystemId, browserId, marketshare, uaClientHintsPlatformVersions, allPatchVersions, stablePatchVersions, browserBaseVersion, operatingSystemVersion, } = entry;
        this.id = id;
        this.pattern = pattern;
        this.operatingSystemId = operatingSystemId;
        this.browserId = browserId;
        this.marketshare = marketshare;
        this.browserBaseVersion = browserBaseVersion;
        this.stablePatchVersions = stablePatchVersions;
        this.allPatchVersions = allPatchVersions;
        this.uaClientHintsPlatformVersions = uaClientHintsPlatformVersions;
        this.operatingSystemVersion = operatingSystemVersion;
    }
    get browserName() {
        return Browsers_1.default.byId(this.browserId).name;
    }
    get operatingSystemName() {
        return OperatingSystems_1.default.byId(this.operatingSystemId).name;
    }
    static parse(object, patchVersion, osVersion) {
        let pattern = object.pattern.replace('$patch$', String(patchVersion));
        if (osVersion) {
            pattern = pattern.replace('$osVersion$', osVersion.replace(/\./g, '_'));
        }
        return pattern;
    }
    static load(object) {
        return new this(object);
    }
    static all() {
        if (!this.byId) {
            this.byId = JSON.parse((0, fs_1.readFileSync)(this.filePath, 'utf8'));
            for (const [id, entry] of Object.entries(this.byId)) {
                this.byId[id] = UserAgent.load(entry);
            }
        }
        return this.byId;
    }
}
UserAgent.filePath = (0, paths_1.getDataFilePath)('userAgentsById.json');
exports.default = UserAgent;
//# sourceMappingURL=UserAgent.js.map