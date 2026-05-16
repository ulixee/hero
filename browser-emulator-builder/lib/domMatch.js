"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedValueDifference = isAllowedValueDifference;
exports.isExplicitExport = isExplicitExport;
function isAllowedValueDifference(diff) {
    const { path, lhs, rhs } = diff;
    if (!path.endsWith('_$value') && !path.endsWith('_$invocation')) {
        return false;
    }
    const isTypeSame = typeof lhs === typeof rhs;
    if (!isTypeSame) {
        return false;
    }
    const itemType = typeof lhs;
    if (itemType === 'number') {
        // if they're diff values of same length, chalk up to different runs
        if (String(lhs).length === String(rhs).length) {
            return true;
        }
        // if decimal points, allow 2 decimal digits diff (often rounding won't include trailing 0s)
        if (String(lhs).includes('.') && Math.abs(String(lhs).length - String(rhs).length) <= 2) {
            return true;
        }
    }
    if (itemType === 'string') {
        if (path.includes('.stack._$value')) {
            const shouldIgnore = lhs.split('\n').shift() === rhs.split('\n').shift();
            if (shouldIgnore)
                return true;
        }
    }
    return false;
}
const explicitExportsToIgnore = ['window.chrome'];
function isExplicitExport(path) {
    return explicitExportsToIgnore.some(x => path.startsWith(x));
}
//# sourceMappingURL=domMatch.js.map