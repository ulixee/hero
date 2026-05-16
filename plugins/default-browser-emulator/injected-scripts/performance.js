"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ utils: { replaceFunction, replaceGetter, ReflectCached }, }) {
    replaceFunction(performance, 'getEntriesByType', (target, thisArg, argArray) => {
        const entries = ReflectCached.apply(target, thisArg, argArray);
        if (argArray[0] === 'navigation') {
            entries.forEach(entry => {
                replaceGetter(entry, 'activationStart', () => 0);
                replaceGetter(entry, 'renderBlockingStatus', () => 'non-blocking');
            });
        }
        return entries;
    });
    replaceFunction(performance, 'getEntries', (target, thisArg, argArray) => {
        const entries = ReflectCached.apply(target, thisArg, argArray);
        entries.forEach(entry => {
            if (entry.entryType === 'navigation') {
                replaceGetter(entry, 'activationStart', () => 0);
                replaceGetter(entry, 'renderBlockingStatus', () => 'non-blocking');
            }
        });
        return entries;
    });
}
