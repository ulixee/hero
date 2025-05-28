"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashMessagePrefix = void 0;
exports.sha256 = sha256;
exports.sortedJsonStringify = sortedJsonStringify;
exports.hashObject = hashObject;
const crypto_1 = require("crypto");
const TypeSerializer_1 = require("./TypeSerializer");
exports.hashMessagePrefix = '\x18Ulixee Signed Message:\n';
function sha256(data) {
    return (0, crypto_1.createHash)('sha256').update(data).digest();
}
function sortedJsonStringify(obj, ignoreProperties = []) {
    if (!obj) {
        return '{}';
    }
    if (Array.isArray(obj) && !obj.length) {
        return '[]';
    }
    return TypeSerializer_1.default.stringify(obj, { ignoreProperties, sortKeys: true });
}
function hashObject(obj, options) {
    // sort keys for consistent hash
    const json = sortedJsonStringify(obj, options?.ignoreProperties);
    let buffer = Buffer.from(`${exports.hashMessagePrefix}${json.length}${json}`);
    if (options?.prefix)
        buffer = Buffer.concat([options.prefix, buffer]);
    return sha256(buffer);
}
//# sourceMappingURL=hashUtils.js.map