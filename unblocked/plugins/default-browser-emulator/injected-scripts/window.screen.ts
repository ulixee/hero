proxyGetter(window.screen, 'availHeight', () => window.screen.height - (args.unAvailHeight || 0), true);
proxyGetter(window.screen, 'availWidth', () => window.screen.width - (args.unAvailWidth || 0), true);
