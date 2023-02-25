if (
  'WorkerGlobalScope' in self ||
  self.location.protocol === 'https:' ||
  'deviceMemory' in navigator
) {
  // @ts-ignore
  proxyGetter(navigator, 'deviceMemory', () => args.memory, true);
}

if ('WorkerGlobalScope' in self || self.location.protocol === 'https:') {
  if ('storage' in navigator && navigator.storage && args.storageTib) {
    proxyFunction(
      navigator.storage,
      'estimate',
      async (target, thisArg, argArray) => {
        const result = await ReflectCached.apply(target, thisArg, argArray);
        result.quota = Math.round(args.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5);
        return result;
      },
      true,
    );
  }

  if (
    'webkitTemporaryStorage' in navigator &&
    'queryUsageAndQuota' in (navigator as any).webkitTemporaryStorage &&
    args.storageTib
  ) {
    proxyFunction(
      (navigator as any).webkitTemporaryStorage,
      'queryUsageAndQuota',
      (target, thisArg, argArray) => {
        return ReflectCached.apply(target, thisArg, [
          usage => {
            (argArray[0] as any)(
              usage,
              Math.round(args.storageTib * 1024 * 1024 * 1024 * 1024 * 0.5),
            );
          },
        ]);
      },
      true,
    );
  }
  if ('memory' in performance && (performance as any).memory) {
    proxyGetter(
      performance,
      'memory' as any,
      function () {
        const result = ReflectCached.apply(...arguments);
        proxyGetter(result, 'jsHeapSizeLimit', () => args.maxHeapSize);
        return result;
      },
      true,
    );
  }
  if ('memory' in console && (console as any).memory) {
    proxyGetter(
      console,
      'memory' as any,
      function () {
        const result = ReflectCached.apply(...arguments);
        proxyGetter(result, 'jsHeapSizeLimit', () => args.maxHeapSize);
        return result;
      },
      true,
    );
  }
}
