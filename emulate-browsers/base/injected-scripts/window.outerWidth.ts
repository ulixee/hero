if (!window.outerWidth) {
  proxyGetter(window, 'outerWidth', () => window.innerWidth + (args.frameBorderWidth || 0), true);
}
