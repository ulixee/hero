"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("./BaseCheck");
class DefaultValueCheck extends BaseCheck_1.default {
    constructor(identity, meta, value) {
        super(identity, meta);
        this.prefix = 'DVAL';
        this.type = BaseCheck_1.CheckType.Individual;
        this.value = value.sort();
    }
    get signature() {
        return `${this.id}:${this.value.join('&')}`;
    }
    get args() {
        return [this.value];
    }
}
exports.default = DefaultValueCheck;
//# sourceMappingURL=DefaultValueCheck.js.map