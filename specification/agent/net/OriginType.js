"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOriginType = isOriginType;
const originTypes = ['none', 'same-origin', 'same-site', 'cross-site'];
function isOriginType(type) {
    return originTypes.includes(type);
}
//# sourceMappingURL=OriginType.js.map