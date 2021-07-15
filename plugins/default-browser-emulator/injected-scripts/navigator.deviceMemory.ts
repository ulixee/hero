if (
  'WorkerGlobalScope' in self ||
  self.location.protocol === 'https:' ||
  'deviceMemory' in navigator
) {
  // @ts-ignore
  proxyGetter(navigator, 'deviceMemory', () => args.memory, true);
}
