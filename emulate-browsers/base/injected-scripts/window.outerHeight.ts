if (args.windowFrame && !window.outerHeight) {
  proxyGetter(window, 'outerHeight', () => window.innerHeight + args.windowFrame);
}
