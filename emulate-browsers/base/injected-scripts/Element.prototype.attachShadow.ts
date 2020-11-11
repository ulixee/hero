const closedShadows = new WeakSet();
const closedShadowOwners = new WeakSet();

proxyGetter(Element.prototype, 'shadowRoot', (_, thisArg) => {
  if (closedShadows.has(thisArg)) return null;
  return ProxyOverride.callOriginal;
});

proxyGetter(ShadowRoot.prototype, 'mode', (_, thisArg) => {
  if (closedShadows.has(thisArg)) return 'closed';
  return ProxyOverride.callOriginal;
});

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
  return shadow;
});
