// Logging error on any of these levels triggers a getter, which could be proxied.
// The same could technically be done for any object so to prevent detection here
// we use json stringify, so we ignore all of this dangerous logic while still
// logging as much as possible of the original object.
const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'log'] as const;
const reflectCached = ReflectCached;

for (const logLevel of logLevels) {
  proxyFunction(console, logLevel, (target, thisArg, args) => {
    const safeArgs = args.map(arg => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2);
      }
      return arg;
    });

    return reflectCached.apply(target, thisArg, safeArgs);
  });
}
