if (window.location?.protocol === 'https:') {
  // @ts-ignore
  proxyGetter(window.navigator, 'deviceMemory', () => args.memory, true);
}
