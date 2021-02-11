if (args.userAgentString && self.navigator?.userAgent !== args.userAgentString) {
  proxyGetter(self.navigator, 'userAgent', () => args.userAgentString, true);
  proxyGetter(
    self.navigator,
    'appVersion',
    () => args.userAgentString.replace('Mozilla/', ''),
    true,
  );
}
if (args.platform && self.navigator?.platform !== args.platform) {
  proxyGetter(self.navigator, 'platform', () => args.platform, true);
}
