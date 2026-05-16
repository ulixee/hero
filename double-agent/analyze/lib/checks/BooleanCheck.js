"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("./BaseCheck");
class BooleanCheck extends BaseCheck_1.default {
    constructor(identity, meta, value) {
        super(identity, meta);
        this.prefix = 'BOOL';
        this.type = BaseCheck_1.CheckType.Individual;
        this.value = value;
    }
    get signature() {
        return `${this.id}:value=${this.value}`;
    }
    get args() {
        return [this.value];
    }
}
exports.default = BooleanCheck;
//# sourceMappingURL=BooleanCheck.js.map