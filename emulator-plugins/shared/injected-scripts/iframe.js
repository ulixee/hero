// This bypass is based on the one from puppeteer-stealth-evasions

/**
 * Fix for the HEADCHR_IFRAME detection (iframe.contentWindow.chrome), hopefully this time without breaking iframes.
 * Note: Only `srcdoc` powered iframes cause issues due to a chromium bug:
 *
 * https://github.com/puppeteer/puppeteer/issues/1106
 */

const createElementToString = Document.prototype.createElement.toString();

Document.prototype.createElement = new Proxy(Document.prototype.createElement, {
  apply() {
    const element = Reflect.apply(...arguments);

    if (!(element instanceof HTMLIFrameElement)) return element;

    let frameProxy;
    const windowProxy = new Proxy(window, {
      get(_, key) {
        // iframe.contentWindow.self === window.top // must be false
        if (key === 'self') {
          return windowProxy;
        }
        // iframe.contentWindow.frameElement === iframe // must be true
        if (key === 'frameElement') {
          return frameProxy;
        }
        return Reflect.get(...arguments);
      },
    });

    const elemToString = element.toString();
    frameProxy = new Proxy(element, {
      get(target, prop) {
        if (prop === 'contentWindow' && !target.contentWindow) {
          return windowProxy;
        }
        return Reflect.get(...arguments);
      },
      has(target, p) {
        return p in target || p === 'contentWindow';
      },
      ownKeys(target) {
        const keys = Reflect.ownKeys(target);
        if (!keys.includes('contentWindow')) keys.push('contentWindow');
      },
      getOwnPropertyDescriptor(target, p) {
        if (p === 'contentWindow') {
          return {};
        }
        return Reflect.getOwnPropertyDescriptor(...arguments);
      },
    });
    definedFuncs.set(frameProxy, elemToString);
    return frameProxy;
  },
});

definedFuncs.set(Document.prototype.createElement, createElementToString);
