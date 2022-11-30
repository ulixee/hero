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
    proxyGetter((performance as any).memory, 'jsHeapSizeLimit', () => args.maxHeapSize, true);
  }
  if ('memory' in console && (console as any).memory) {
    proxyGetter((console as any).memory, 'jsHeapSizeLimit', () => args.maxHeapSize, true);
  }
}
