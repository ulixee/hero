// This bypass is based on the one from puppeteer-stealth-evasions

const frameWindowProxies = new WeakMap();
const hasRunNewDocumentScripts = new WeakSet();

const originalContentWindow = Object.getOwnPropertyDescriptor(
  self.HTMLIFrameElement.prototype,
  'contentWindow',
).get;

function getTrueContentWindow(frame: HTMLIFrameElement): Window {
  return originalContentWindow.apply(frame);
}

proxyGetter(self.HTMLIFrameElement.prototype, 'contentWindow', (target, iframe) => {
  if (frameWindowProxies.has(iframe) && iframe.isConnected) {
    return frameWindowProxies.get(iframe);
  }
  return ProxyOverride.callOriginal;
});

proxySetter(self.HTMLIFrameElement.prototype, 'srcdoc', function (_, iframe) {
  // proxy to current window until srcdoc window is created (headless issue)
  if (!frameWindowProxies.has(iframe)) {
    const proxy = new Proxy(self, {
      get(target, key) {
        if (key === 'self' || key === 'contentWindow') {
          return iframe.contentWindow;
        }

        if (key === 'document') {
          // see if the window has been allocated
          const contentWindow = getTrueContentWindow(iframe);
          if (contentWindow) {
            if (!hasRunNewDocumentScripts.has(contentWindow)) {
              hasRunNewDocumentScripts.add(contentWindow);
              // @ts-expect-error
              newDocumentScript(contentWindow);
              frameWindowProxies.delete(iframe);
            }
            return contentWindow.document;
          }
          return null;
        }

        // iframe.contentWindow.frameElement === iframe // must be true
        if (key === 'frameElement') {
          return iframe;
        }

        // Intercept iframe.contentWindow[0] to hide the property 0 added by the proxy.
        if (key === '0') {
          return undefined;
        }

        // use original self properties (no window yet)
        return ReflectCached.get(target, key);
      },
    });

    frameWindowProxies.set(iframe, proxy);
  }
  return ProxyOverride.callOriginal;
});
