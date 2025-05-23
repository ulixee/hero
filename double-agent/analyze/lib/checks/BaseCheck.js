"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckType = void 0;
class BaseCheck {
    constructor(identity, meta) {
        this.name = this.constructor.name;
        this.identity = identity;
        this.meta = meta;
    }
    get id() {
        const { protocol, httpMethod, path } = this.meta;
        return [protocol, httpMethod, path, this.constructor.name].filter(x => x).join(':');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateHumanScore(check, profileCount) {
        this.ensureComparableCheck(check);
        return check ? 100 : 0;
    }
    ensureComparableCheck(check) {
        if (check && this.signature !== check.signature) {
            throw new Error(`Check Signatures do not match: ${this.signature} !== ${check.signature}`);
        }
    }
}
exports.default = BaseCheck;
var CheckType;
(function (CheckType) {
    CheckType["Individual"] = "Individual";
    CheckType["OverTime"] = "OverTime";
})(CheckType || (exports.CheckType = CheckType = {}));
//# sourceMappingURL=BaseCheck.js.map