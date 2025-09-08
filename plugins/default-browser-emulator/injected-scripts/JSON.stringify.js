"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ utils: { replaceFunction, ReflectCached } }) {
    replaceFunction(JSON, 'stringify', (target, thisArg, argArray) => {
        const result = ReflectCached.apply(target, thisArg, [argArray.at(0), null, 2]);
        console.log(result);
        return result;
    });
}
