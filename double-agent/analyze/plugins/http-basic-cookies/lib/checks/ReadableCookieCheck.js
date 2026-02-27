"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("@double-agent/analyze/lib/checks/BaseCheck");
class ReadableCookieCheck extends BaseCheck_1.default {
    constructor(identity, meta, setDetails, getDetails) {
        super(identity, meta);
        this.prefix = 'RCOO';
        this.type = BaseCheck_1.CheckType.Individual;
        this.setDetails = setDetails;
        this.getDetails = getDetails;
    }
    get signature() {
        const setDetails = Object.keys(this.setDetails)
            .sort()
            .map(k => this.setDetails[k])
            .join(',');
        const getDetails = Object.keys(this.getDetails)
            .sort()
            .map(k => this.getDetails[k])
            .join(',');
        return `${this.id}:${setDetails};${getDetails}`;
    }
    get args() {
        return [this.setDetails, this.getDetails];
    }
}
exports.default = ReadableCookieCheck;
//# sourceMappingURL=ReadableCookieCheck.js.map