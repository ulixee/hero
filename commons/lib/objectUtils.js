"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterUndefined = filterUndefined;
exports.omit = omit;
exports.pick = pick;
function filterUndefined(object, omitKeys) {
    if (!object)
        return object;
    const result = {};
    for (const [key, value] of Object.entries(object)) {
        if (omitKeys?.includes(key))
            continue;
        if (value !== undefined)
            result[key] = value;
    }
    return result;
}
function omit(object, keys) {
    object = Object(object);
    const result = {};
    for (const [key, value] of Object.entries(object)) {
        if (!keys.includes(key)) {
            result[key] = value;
        }
    }
    return result;
}
function pick(object, keys) {
    object = Object(object);
    const result = {};
    for (const [key, value] of Object.entries(object)) {
        if (keys.includes(key)) {
            result[key] = value;
        }
    }
    return result;
}
//# sourceMappingURL=objectUtils.js.map