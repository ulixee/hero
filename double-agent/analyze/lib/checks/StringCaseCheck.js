"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StringCheck_1 = require("./StringCheck");
const BaseCheck_1 = require("./BaseCheck");
class StringCaseCheck extends StringCheck_1.default {
    constructor() {
        super(...arguments);
        this.prefix = 'STRC';
        this.type = BaseCheck_1.CheckType.Individual;
    }
    get signature() {
        return `${this.id}:${this.value}`;
    }
    get args() {
        return [this.value];
    }
}
exports.default = StringCaseCheck;
//# sourceMappingURL=StringCaseCheck.js.map