"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("./BaseCheck");
class NumberLengthCheck extends BaseCheck_1.default {
    constructor(identity, meta, length) {
        super(identity, meta);
        this.prefix = 'NUML';
        this.type = BaseCheck_1.CheckType.Individual;
        this.length = length;
    }
    get signature() {
        return `${this.id}:${this.length}`;
    }
    get args() {
        return [this.length];
    }
}
exports.default = NumberLengthCheck;
//# sourceMappingURL=NumberLengthCheck.js.map