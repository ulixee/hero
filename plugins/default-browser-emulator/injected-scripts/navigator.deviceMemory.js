"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedArgs = args;
if ('WorkerGlobalScope' in self ||
    self.location.protocol === 'https:' ||
    'deviceMemory' in navigator) {
    replaceGetter(self.navigator, 'deviceMemory', () => typedArgs.memory, { overrideOnlyForInstance: true });
}
if ('WorkerGlobalScope' in self || self.location.protocol === 'https:') {
    if ('storage' in navigator && navigator.storage && typedArgs.storageTib) {
        replaceFunction(self.navigator.storage, 'estimate', async (target, thisArg, argArray) => {
            const result = await ReflectCached.apply(target, thisArg, argArray);
            result.quota = Math.round(typedArgs.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5);
            return result;
        }, { onlyForInstance: true });
    }
    if ('webkitTemporaryStorage' in navigator &&
        'queryUsageAndQuota' in navigator.webkitTemporaryStorage &&
        typedArgs.storageTib) {
        replaceFunction(self.navigator.webkitTemporaryStorage, 'queryUsageAndQuota', (target, thisArg, argArray) => {
            return ReflectCached.apply(target, thisArg, [
                usage => {
                    argArray[0](usage, Math.round(typedArgs.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5));
                },
            ]);
        }, { onlyForInstance: true });
    }
    if ('memory' in performance && performance.memory) {
        replaceGetter(self.performance, 'memory', (target, thisArg, argArray) => {
            const result = ReflectCached.apply(target, thisArg, argArray);
            replaceGetter(result, 'jsHeapSizeLimit', () => typedArgs.maxHeapSize);
            return result;
        }, { onlyForInstance: true });
    }
    if ('memory' in console && console.memory) {
        replaceGetter(self.console, 'memory', (target, thisArg, argArray) => {
            const result = ReflectCached.apply(target, thisArg, argArray);
            replaceGetter(result, 'jsHeapSizeLimit', () => typedArgs.maxHeapSize);
            return result;
        }, { onlyForInstance: true });
    }
}
