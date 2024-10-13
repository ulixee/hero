export type Args = {
  memory: number;
  maxHeapSize: number;
  storageTib: number;
};
const typedArgs = args as Args;

if (
  'WorkerGlobalScope' in self ||
  self.location.protocol === 'https:' ||
  'deviceMemory' in navigator
) {
  replaceGetter(
    self.navigator,
    'deviceMemory' as keyof Navigator,
    () => typedArgs.memory,
    { onlyForInstance: true },
  );
}

if ('WorkerGlobalScope' in self || self.location.protocol === 'https:') {
  if ('storage' in navigator && navigator.storage && typedArgs.storageTib) {
    replaceFunction(
      self.navigator.storage,
      'estimate',
      async (target, thisArg, argArray) => {
        const result = await ReflectCached.apply(target, thisArg, argArray) as any;
        result.quota = Math.round(typedArgs.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5);
        return result;
      },
      { onlyForInstance: true },
    );
  }

  if (
    'webkitTemporaryStorage' in navigator &&
    'queryUsageAndQuota' in (navigator as any).webkitTemporaryStorage &&
    typedArgs.storageTib
  ) {
    replaceFunction(
      (self.navigator as any).webkitTemporaryStorage,
      'queryUsageAndQuota',
      (target, thisArg, argArray) => {
        return ReflectCached.apply(target, thisArg, [
          usage => {
            (argArray[0] as any)(
              usage,
              Math.round(typedArgs.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5),
            );
          },
        ]);
      },
      { onlyForInstance: true },
    );
  }
  if ('memory' in performance && (performance as any).memory) {
    replaceGetter(
      self.performance,
      'memory' as any,
      (target, thisArg, argArray) => {
        const result = ReflectCached.apply(target, thisArg, argArray) as any;
        replaceGetter(result, 'jsHeapSizeLimit', () => typedArgs.maxHeapSize);
        return result;
      },
      { onlyForInstance: true },
    );
  }
  if ('memory' in console && (console as any).memory) {
    replaceGetter(
      self.console,
      'memory' as any,
      (target, thisArg, argArray) => {
        const result = ReflectCached.apply(target, thisArg, argArray) as any;
        replaceGetter(result, 'jsHeapSizeLimit', () => typedArgs.maxHeapSize);
        return result;
      },
      { onlyForInstance: true },
    );
  }
}
