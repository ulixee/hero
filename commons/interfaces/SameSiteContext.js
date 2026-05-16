"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameSiteContext = isSameSiteContext;
const sameSiteContext = ['none', 'strict', 'lax'];
function isSameSiteContext(type) {
    return sameSiteContext.includes(type);
}
//# sourceMappingURL=SameSiteContext.js.map