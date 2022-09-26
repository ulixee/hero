if (
  'WorkerGlobalScope' in self ||
  self.location.protocol === 'https:' ||
  'deviceMemory' in navigator
) {
  // @ts-ignore
  proxyGetter(navigator, 'deviceMemory', () => args.memory, true);
}

if ('WorkerGlobalScope' in self || self.location.protocol === 'https:' || 'memory' in performance) {
  proxyGetter((performance as any).memory, 'jsHeapSizeLimit', () => args.maxHeapSize, true);
  if ('memory' in console) {
    proxyGetter((console as any).memory, 'jsHeapSizeLimit', () => args.maxHeapSize, true);
  }
}
