"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("./BaseCheck");
class StringArrayCheck extends BaseCheck_1.default {
    constructor(identity, meta, value) {
        super(identity, meta);
        this.prefix = 'STRA';
        this.type = BaseCheck_1.CheckType.Individual;
        this.value = value;
    }
    get signature() {
        return `${this.id}:${this.value}`;
    }
    get args() {
        return [this.value];
    }
}
exports.default = StringArrayCheck;
//# sourceMappingURL=StringArrayCheck.js.map