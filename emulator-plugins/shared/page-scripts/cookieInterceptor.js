const triggerName = args.callbackName;

if (!window[triggerName]) throw new Error('No cookie trigger');
const cookieTrigger = window[triggerName].bind(window);

delete window[triggerName];

const origin = window.location.origin;
const cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
if (!cookieDesc) throw new Error('No cookie desc');

const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
descriptor.set = new Proxy(descriptor.set, {
  apply(target, thisArg, argArray) {
    if (argArray.length) {
      const cookie = argArray[0];
      cookieTrigger(JSON.stringify({ cookie, origin }));
    }
    return Reflect.apply(...arguments);
  },
});

if (args.setToString) {
  definedFuncs.set(descriptor.set, args.setToString);
}
Object.defineProperty(Document.prototype, 'cookie', descriptor);
