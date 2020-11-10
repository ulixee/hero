if (!window.outerWidth) {
  proxyGetter(window, 'outerWidth', () => window.innerWidth);
}
