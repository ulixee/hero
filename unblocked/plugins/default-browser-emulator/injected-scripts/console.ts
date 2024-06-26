const mode = args.mode;

ObjectCached.keys(console).forEach(key => {
  proxyFunction(console, key, (target, thisArg, args) => {
    if (mode === 'disableConsole') return undefined;
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
    const nameDesc =
      Object.getOwnPropertyDescriptor(object, 'name') ??
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(object), 'name');
    const { message: msgDesc, stack: stackDesc } = Object.getOwnPropertyDescriptors(object);

    const isSafeName = nameDesc.hasOwnProperty('value');
    const isSafeMsg = msgDesc.hasOwnProperty('value');
    const isSafeStack = stackDesc?.get === defaultErrorStackGetter;

    if (isSafeName && isSafeMsg && isSafeStack) {
      return object;
    }

    const name = isSafeName ? object.name : 'NameNotSafe';
    const msg = isSafeMsg ? object.message : 'message removed because its not safe';
    const error = new Error(`Unblocked stealth created new error from ${name}: ${msg}`);
    error.stack = `${msg}\n   Stack removed to prevent leaking debugger active`;
    return error;
  }

  if (object instanceof Array) {
    return object.map(item => replaceErrorStackWithOriginal(item));
  }

  return ObjectCached.values(object).map(item => replaceErrorStackWithOriginal(item));
}
