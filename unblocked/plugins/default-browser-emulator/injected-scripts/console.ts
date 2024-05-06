ObjectCached.keys(console).forEach(key => {
  proxyFunction(console, key, (target, thisArg, args) => {
    args = replaceErrorStackWithOriginal(args);
    return ReflectCached.apply(target, thisArg, args);
  });
});

const defaultErrorStackGetter = Object.getOwnPropertyDescriptor(new Error(''), 'stack').get;

function replaceErrorStackWithOriginal(object: unknown) {
  if (!object || typeof object !== 'object') {
    return object;
  }

  if (object instanceof Error) {
    if (ObjectCached.getOwnPropertyDescriptor(object, 'stack')?.get === defaultErrorStackGetter) {
      return object;
    }

    const error = new Error(`Unblocked stealth created new error from: ${JSON.stringify(object)}`);
    error.stack = `${error.message}\n   Stack removed to prevent leaking debugger active (error stack was proxied)`;
    return error;
  }

  if (object instanceof Array) {
    return object.map(item => replaceErrorStackWithOriginal(item));
  }

  return ObjectCached.values(object).map(item => replaceErrorStackWithOriginal(item));
}
