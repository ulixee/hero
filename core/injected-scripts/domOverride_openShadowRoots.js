const closedShadows = new WeakSet();
const closedShadowOwners = new WeakSet();
const shadowTriggerName = args.callbackName;
let shadowTrigger = (_) => { };
// eslint-disable-next-line no-restricted-globals
if (self[shadowTriggerName]) {
    shadowTrigger = self[shadowTriggerName].bind(self); // eslint-disable-line no-restricted-globals
    delete self[shadowTriggerName]; // eslint-disable-line no-restricted-globals
}
proxyGetter(Element.prototype, 'shadowRoot', (_, thisArg) => {
    if (closedShadowOwners.has(thisArg))
        return null;
    return ProxyOverride.callOriginal;
});
proxyGetter(ShadowRoot.prototype, 'mode', (_, thisArg) => {
    if (closedShadows.has(thisArg))
        return 'closed';
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
        let element = thisArg;
        // only traverse elements if connected
        if (element.isConnected) {
            const path = [];
            let top;
            while (element) {
                let parentElement = element.parentElement;
                top = {
                    localName: element.localName,
                    id: element.id,
                    index: parentElement ? ArrayIndexOfCache.call(parentElement.children, element) : 0,
                    hasShadowHost: false
                };
                if (!parentElement) {
                    const parentNode = element.parentNode;
                    if (parentNode && parentNode?.host) {
                        parentElement = parentNode.host;
                        top.hasShadowHost = true;
                        top.index = ArrayIndexOfCache.call(parentNode.children, element);
                    }
                }
                path.unshift(top);
                if (!parentElement || element.localName === 'body')
                    break;
                element = parentElement;
            }
            shadowTrigger(JSON.stringify(path));
        }
    }
    catch (err) {
        // drown errors
    }
    return shadow;
});
//# sourceMappingURL=domOverride_openShadowRoots.js.map