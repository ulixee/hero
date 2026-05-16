"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseCheck_1 = require("./BaseCheck");
class PathCheck extends BaseCheck_1.default {
    constructor(identity, meta) {
        super(identity, meta);
        this.prefix = 'PATH';
        this.type = BaseCheck_1.CheckType.Individual;
    }
    get signature() {
        return `${this.meta}:${this.constructor.name}`;
    }
    get args() {
        return [];
    }
}
exports.default = PathCheck;
//# sourceMappingURL=PathCheck.js.map