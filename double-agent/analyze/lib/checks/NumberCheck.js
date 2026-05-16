"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("./BaseCheck");
class NumberCheck extends BaseCheck_1.default {
    constructor(identity, meta, value, label) {
        super(identity, meta);
        this.prefix = 'NUMR';
        this.type = BaseCheck_1.CheckType.Individual;
        this.value = value;
        this.label = label;
    }
    get signature() {
        return `${this.id}:${this.value}`;
    }
    get args() {
        return [this.value, this.label];
    }
}
exports.default = NumberCheck;
//# sourceMappingURL=NumberCheck.js.map