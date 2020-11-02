const closedShadows = new WeakSet();
const closedShadowOwners = new WeakSet();

proxyDescriptors(Element.prototype, {
  shadowRoot: {
    global: true,
    get(_, thisArg) {
      if (closedShadows.has(thisArg)) return null;
      return nativeKey;
    },
  },
});

proxyDescriptors(ShadowRoot.prototype, {
  mode: {
    global: true,
    get(_, thisArg) {
      if (closedShadows.has(thisArg)) return 'closed';
      return nativeKey;
    },
  },
});

proxyFunction(Element.prototype, 'attachShadow', (func, thisArg, init) => {
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
