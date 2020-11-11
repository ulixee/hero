// This bypass is based on the one from puppeteer-stealth-evasions

const frameWindowProxies = new WeakMap();

proxyGetter(HTMLIFrameElement.prototype, 'contentWindow', (target, iframe) => {
  if (frameWindowProxies.has(iframe)) {
    return frameWindowProxies.get(iframe);
  }
  return ProxyOverride.callOriginal;
});

proxySetter(HTMLIFrameElement.prototype, 'srcdoc', function(_, iframe) {
  if (!frameWindowProxies.has(iframe)) {
    const proxy = new Proxy(window, {
      get(target, key) {
        if (key === 'self') {
          return iframe.contentWindow;
        }
        if (key === 'document') {
          return iframe.contentDocument || iframe.contentWindow.document;
        }
        // iframe.contentWindow.frameElement === iframe // must be true
        if (key === 'frameElement') {
          return iframe;
        }
        return ReflectCached.get(window, key);
      },
    });

    frameWindowProxies.set(iframe, proxy);
  }
  return ProxyOverride.callOriginal;
});
