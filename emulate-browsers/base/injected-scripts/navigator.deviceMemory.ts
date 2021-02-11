if ('WorkerGlobalScope' in self || self.location.protocol === 'https:') {
  // @ts-ignore
  proxyGetter(navigator, 'deviceMemory', () => args.memory, true);
}
