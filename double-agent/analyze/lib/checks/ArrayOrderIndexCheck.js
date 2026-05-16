"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("./BaseCheck");
class ArrayOrderIndexCheck extends BaseCheck_1.default {
    constructor(identity, meta, orderIndex) {
        super(identity, meta);
        this.prefix = 'AORD';
        this.type = BaseCheck_1.CheckType.Individual;
        this.orderIndex = orderIndex;
    }
    get signature() {
        const index = this.orderIndex.map(i => i.join(',')).join(';');
        return `${this.id}:${index}`;
    }
    get args() {
        return [this.orderIndex];
    }
}
exports.default = ArrayOrderIndexCheck;
//# sourceMappingURL=ArrayOrderIndexCheck.js.map