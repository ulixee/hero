if (
  'WorkerGlobalScope' in self ||
  self.location.protocol === 'https:' ||
  'deviceMemory' in navigator
) {
  // @ts-ignore
  proxyGetter(navigator, 'deviceMemory', () => args.memory, true);
}

if ('WorkerGlobalScope' in self || self.location.protocol === 'https:') {
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
