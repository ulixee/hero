if (!window.outerHeight) {
  proxyGetter(window, 'outerHeight', () => window.innerHeight + (args.frameBorderHeight || 0), true);
}
