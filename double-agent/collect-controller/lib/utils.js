"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.average = average;
function average(numbers) {
    if (!numbers.length)
        return 0;
    return Math.floor(numbers.reduce((t, c) => t + c, 0) / numbers.length);
}
//# sourceMappingURL=utils.js.map