proxyFunction(Error, 'captureStackTrace', (func, thisArg, ...parameters) => {
  const stack = func.apply(thisArg, parameters);
  const err = cleanErrorStack({ stack });
  return err.stack;
});

(function proxyConstructor() {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'Error');
  const toString = descriptor.value.toString();
  function construct() {
    const err = ReflectCached.construct(...arguments);
    cleanErrorStack(err);
    return err;
  }
  descriptor.value = new Proxy(Error, {
    construct,
  });
  definedFuncs.set(descriptor.value, toString);
  Object.defineProperty(window, 'Error', descriptor);
})();
