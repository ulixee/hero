import type { ScriptInput } from '@ulixee/default-browser-emulator/injected-scripts/_utils';

export type Args = { callbackName: string };

export function main({
  callback,
  args,
  utils: { replaceGetter, replaceFunction, ReflectCached },
}: ScriptInput<Args>) {
  const closedShadows = new WeakSet<ShadowRoot>();
  const closedShadowOwners = new WeakSet<Element>();

  const shadowTriggerCallback = callback.bind(null, args.callbackName);

  replaceGetter(Element.prototype, 'shadowRoot', (target, thisArg, argArray) => {
    if (closedShadowOwners.has(thisArg)) return null;

    return ReflectCached.apply(target, thisArg, argArray);
  });

  replaceGetter(ShadowRoot.prototype, 'mode', (target, thisArg, argArray) => {
    if (closedShadows.has(thisArg)) return 'closed';
    return ReflectCached.apply(target, thisArg, argArray);
  });

  const ArrayIndexOfCache = Array.prototype.indexOf;

  replaceFunction(Element.prototype, 'attachShadow', (func, thisArg, argArray) => {
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
        const path: { localName: string; id: string; index: number; hasShadowHost: boolean }[] = [];
        let top: (typeof path)[0];
        while (element) {
          let parentElement: Element = element.parentElement;

          top = {
            localName: element.localName,
            id: element.id,
            index: parentElement ? ArrayIndexOfCache.call(parentElement.children, element) : 0,
            hasShadowHost: false,
          };

          if (!parentElement) {
            const parentNode = element.parentNode;
            if (parentNode && (parentNode as ShadowRoot)?.host) {
              parentElement = (parentNode as ShadowRoot).host;
              top.hasShadowHost = true;
              top.index = ArrayIndexOfCache.call(parentNode.children, element);
            }
          }
          path.unshift(top);

          if (!parentElement || element.localName === 'body') break;

          element = parentElement;
        }
        shadowTriggerCallback(JSON.stringify(path));
      }
    } catch (err) {
      // drown errors
    }
    return shadow;
  });
}
