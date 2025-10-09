"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceGetter, replaceFunction, ReflectCached } }) {
    if ('WorkerGlobalScope' in self ||
        self.location.protocol === 'https:' ||
        'deviceMemory' in navigator) {
        replaceGetter(self.navigator, 'deviceMemory', () => args.memory, {
            onlyForInstance: true,
        });
    }
    if ('WorkerGlobalScope' in self || self.location.protocol === 'https:') {
        if ('storage' in navigator && navigator.storage && args.storageTib) {
            replaceFunction(self.navigator.storage, 'estimate', async (target, thisArg, argArray) => {
                const result = (await ReflectCached.apply(target, thisArg, argArray));
                result.quota = Math.round(args.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5);
                return result;
            }, { onlyForInstance: true });
        }
        if ('webkitTemporaryStorage' in navigator &&
            'queryUsageAndQuota' in navigator.webkitTemporaryStorage &&
            args.storageTib) {
            replaceFunction(self.navigator.webkitTemporaryStorage, 'queryUsageAndQuota', (target, thisArg, argArray) => {
                return ReflectCached.apply(target, thisArg, [
                    usage => {
                        argArray[0](usage, Math.round(args.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5));
                    },
                ]);
            }, { onlyForInstance: true });
        }
        if ('memory' in performance && performance.memory) {
            replaceGetter(self.performance, 'memory', (target, thisArg, argArray) => {
                const result = ReflectCached.apply(target, thisArg, argArray);
                replaceGetter(result, 'jsHeapSizeLimit', () => args.maxHeapSize);
                return result;
            }, { onlyForInstance: true });
        }
        if ('memory' in console && console.memory) {
            replaceGetter(self.console, 'memory', (target, thisArg, argArray) => {
                const result = ReflectCached.apply(target, thisArg, argArray);
                replaceGetter(result, 'jsHeapSizeLimit', () => args.maxHeapSize);
                return result;
            }, { onlyForInstance: true });
        }
    }
}
