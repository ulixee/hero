"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deepDiff;
function deepDiff(lhs, rhs, prevPath, key, compare) {
    if (!compare) {
        compare = {
            same: [],
            added: [],
            removed: [],
            changed: [],
            changedOrder: [],
        };
    }
    let path = prevPath ?? '';
    if (key !== undefined && key !== null) {
        if (path)
            path += '.';
        path += String(key);
    }
    const isSame = Object.is(lhs, rhs);
    if (isSame) {
        compare.same.push(path);
        return compare;
    }
    const isLeftDefined = lhs !== undefined;
    const isRightDefined = rhs !== undefined;
    if (!isLeftDefined && isRightDefined) {
        compare.added.push({ path, rhs });
        return compare;
    }
    if (isLeftDefined && !isRightDefined) {
        compare.removed.push({ path, lhs, rhs });
        return compare;
    }
    const leftType = typeof lhs;
    const rightType = typeof rhs;
    if (leftType !== rightType || (leftType !== 'object' && isSame === false)) {
        compare.changed.push({ path, lhs, rhs });
        return compare;
    }
    if (leftType === 'object' && lhs && rhs) {
        const lKeys = Object.keys(lhs);
        const rKeys = Object.keys(rhs);
        const realKeysLhs = lKeys.filter(x => x[0] !== '_');
        const realKeysRhs = rKeys.filter(x => x[0] !== '_');
        if (realKeysLhs.toString() !== realKeysRhs.toString()) {
            compare.changedOrder.push({ path, lhs: lKeys, rhs: rKeys });
        }
        for (const lKey of lKeys) {
            if (lKey in rhs) {
                deepDiff(lhs[lKey], rhs[lKey], path, lKey, compare);
            }
            else {
                compare.removed.push({ path: `${path}.${lKey}`, lhs: lhs[lKey] });
            }
        }
        for (const rKey of rKeys) {
            if (rKey in lhs)
                continue;
            compare.added.push({ path: `${path}.${rKey}`, rhs: rhs[rKey] });
        }
    }
    else {
        console.log('removed something?', leftType, lhs);
    }
    return compare;
}
//# sourceMappingURL=deepDiff.js.map