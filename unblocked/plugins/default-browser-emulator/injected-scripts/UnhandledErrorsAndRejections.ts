self.addEventListener('error', preventDefault);
self.addEventListener('unhandledrejection', preventDefault);

function preventDefault(event: ErrorEvent | PromiseRejectionEvent) {
  event.preventDefault();

  // Hide this, but make sure if they hide it we mimic normal behaviour
  let prevented = event.defaultPrevented;
  proxyFunction(
    event,
    'preventDefault',
    (originalFunction, thisArg, argArray) => {
      // Will raise correct error if 'thisArg' is wrong
      ReflectCached.apply(originalFunction, thisArg, argArray);
      prevented = true;
    },
    true,
  );
  proxyGetter(
    event,
    'defaultPrevented',
    (target, thisArg) => {
      ReflectCached.get(target, thisArg);
      return prevented;
    },
    true,
  );

  if (!('console' in self)) {
    return;
  }

  const error = event instanceof ErrorEvent ? event.error : event.reason;
  self.console.error(`Default ${event.type} event prevented, error:`, error);
}
