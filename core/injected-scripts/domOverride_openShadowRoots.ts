declare let proxyGetter;
declare let proxyFunction;
declare let ProxyOverride;
declare let args;

const closedShadows = new WeakSet<ShadowRoot>();
const closedShadowOwners = new WeakSet<Element>();

const shadowTriggerName = args.callbackName;
let shadowTrigger = (_: string) => {};
// eslint-disable-next-line no-restricted-globals
if (self[shadowTriggerName]) {
  shadowTrigger = (self[shadowTriggerName] as unknown as Function).bind(self); // eslint-disable-line no-restricted-globals
  delete self[shadowTriggerName]; // eslint-disable-line no-restricted-globals
}

proxyGetter(Element.prototype, 'shadowRoot', (_, thisArg) => {
  if (closedShadowOwners.has(thisArg)) return null;
  return ProxyOverride.callOriginal;
});

proxyGetter(ShadowRoot.prototype, 'mode', (_, thisArg) => {
  if (closedShadows.has(thisArg)) return 'closed';
  return ProxyOverride.callOriginal;
});

const ArrayIndexOfCache = Array.prototype.indexOf;

proxyFunction(Element.prototype, 'attachShadow', (func, thisArg, argArray) => {
  const init = argArray?.length ? argArray[0] : null;
  const needsCloseRemoval = init && init.mode === 'closed';
  if (needsCloseRemoval) {
    init.mode = 'open';
  }

  const shadow = func.apply(thisArg, [init]);
  if (needsCloseRemoval) {
    closedShadowOwners.add(thisArg);
    closedShadows.add(shadow);
  }

  try {
    let element = thisArg as Element;
    // only traverse elements if connected
    if (element.isConnected) {
      const path: { localName: string; id:string; index: number; hasShadowHost: boolean }[] = [];
      let top: typeof path[0];
      while (element) {
        let parentElement: Element = element.parentElement;

        top = {
          localName: element.localName,
          id: element.id,
          index: parentElement ? ArrayIndexOfCache.call(parentElement.children, element) : 0,
          hasShadowHost: false
        };

        if (!parentElement) {
          const parentNode = element.parentNode;
          if (parentNode && (parentNode as ShadowRoot)?.host) {
            parentElement = (parentNode as ShadowRoot).host;
            top.hasShadowHost = true;
            top.index = ArrayIndexOfCache.call(parentNode.children, element)
          }
        }
        path.unshift(top);

        if (!parentElement || element.localName === 'body') break;

        element = parentElement;
      }
      shadowTrigger(JSON.stringify(path));
    }
  } catch (err) {
    // drown errors
  }
  return shadow;
});
