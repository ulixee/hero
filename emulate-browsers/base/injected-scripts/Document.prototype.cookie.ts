declare let args: any;
const triggerName = args.callbackName;

if (!window[triggerName]) throw new Error('No cookie trigger');
const cookieTrigger = ((window[triggerName] as unknown) as Function).bind(window);

delete window[triggerName];

proxySetter(Document.prototype, 'cookie', (target, thisArg, cookie) => {
  cookieTrigger(JSON.stringify({ cookie, origin: window.location.origin }));
  return ProxyOverride.callOriginal;
});
