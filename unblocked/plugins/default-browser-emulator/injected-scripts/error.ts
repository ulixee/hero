export type Args = {
  fixConsoleStack: boolean;
  removeInjectedLines: boolean;
  applyStackTraceLimit: boolean;
};

const typedArgs = args as Args;

if (typeof self === 'undefined') {
  // We need to consider to migrate these scripts to functions to actually reflect how they are run
  // @ts-ignore
  return;
}

const OriginalError = Error;
const originalErrorProperties = ObjectCached.getOwnPropertyDescriptors(Error);

Error.stackTraceLimit = 10000;
Error.prepareStackTrace = prepareStackTrace;

ObjectCached.defineProperty(self, 'Error', {
  // eslint-disable-next-line object-shorthand
  value: function (this, msg) {
    // eslint-disable-next-line strict
    'use strict';
    let constructor;
    try {
      constructor = this && ObjectCached.getPrototypeOf(this).constructor === Error;
    } catch {}

    if (!constructor) {
      return ReflectCached.apply(OriginalError, this, [msg]);
    }
    return ReflectCached.construct(OriginalError, [msg]);
  },
});

ObjectCached.defineProperties(Error, originalErrorProperties);
Error.prototype.constructor = Error;
toOriginalFn.set(Error, OriginalError);

ObjectCached.getOwnPropertyNames(self).forEach(key => {
  if (!key.includes('Error')) return;
  const item = self[key];
  if (OriginalError.isPrototypeOf(item) && ObjectCached.getPrototypeOf(item) === OriginalError) {
    ObjectCached.setPrototypeOf(item, Error);
  }
});

function prepareStackAndStackTraces(
  error: Error,
  stackTraces: NodeJS.CallSite[] = [],
): { stack?: string; stackTraces: NodeJS.CallSite[] } {
  let stack = error.stack;
  const safeStackTraces: NodeJS.CallSite[] = [];
  if (!stack) return { stack, stackTraces: safeStackTraces };

  const lines = stack.split('\n');
  const safeLines: string[] = [];
  // Chrome debugger generates these things one the fly for every letter you type in
  // devtools so it can dynamically generates previews, but this is super annoying when
  // working with debug points. Also we don't need to modify them because they only contain
  // a single first line, which never leaks any information
  if (lines.length <= 1) return { stack, stackTraces };

  // First line never leak
  safeLines.push(lines[0]);

  // stack lines - first line = stackTraces array
  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];
    let stackTrace = stackTraces.at(i - 1);

    // First line doesnt count for limit
    if (safeLines.length > Error.stackTraceLimit && typedArgs.applyStackTraceLimit) break;

    if (typedArgs.fixConsoleStack && line.includes(sourceUrl) && line.includes('console.')) {
      ({ line, stackTrace } = fixConsoleStack(line, stackTrace));
    }

    if (line.includes(sourceUrl) && typedArgs.removeInjectedLines) continue;

    safeLines.push(line);
    if (stackTrace) safeStackTraces.push(stackTrace);
  }

  stack = safeLines.join('\n');
  return { stack, stackTraces: safeStackTraces };
}

function fixConsoleStack(line: string, stackTrace?: NodeJS.CallSite) {
  line = `${line.substring(0, 20)}(<anonymous>)`;
  if (stackTrace) {
    const originalProperties = ObjectCached.getOwnPropertyDescriptors(
      ObjectCached.getPrototypeOf(stackTrace),
    );
    const writeableProperties = ObjectCached.getOwnPropertyDescriptors(
      ObjectCached.getPrototypeOf(stackTrace),
    );

    ObjectCached.keys(writeableProperties).forEach(key => {
      writeableProperties[key].writable = true;
      writeableProperties[key].configurable = true;
    });
    const newProto = {};
    ObjectCached.defineProperties(newProto, writeableProperties);
    ObjectCached.setPrototypeOf(stackTrace, newProto);

    [
      'getScriptNameOrSourceURL',
      'getLineNumber',
      'getEnclosingLineNumber',
      'getEnclosingColumnNumber',
      'getColumnNumber',
    ].forEach(key =>
      replaceFunction(stackTrace as any, key, (target, thisArg, argArray) => {
        const _result = ReflectCached.apply(target, thisArg, argArray);
        return null;
      }),
    );

    replaceFunction(stackTrace as any, 'getPosition', (target, thisArg, argArray) => {
      const _result = ReflectCached.apply(target, thisArg, argArray);
      return 0;
    });

    const ObjectCachedHere = ObjectCached;
    ObjectCached.keys(originalProperties).forEach(key => {
      ObjectCachedHere.defineProperty(newProto, key, {
        ...ObjectCachedHere.getOwnPropertyDescriptor(newProto, key),
        writable: originalProperties[key].writable,
        configurable: originalProperties[key].configurable,
      });
    });
  }

  return { line, stackTrace };
}

function prepareStackTrace(error, stackTraces) {
  const { stack, stackTraces: safeStackTraces } = prepareStackAndStackTraces(error, stackTraces);

  const customPrepareStackTrace = Error.prepareStackTrace;
  if (!customPrepareStackTrace) {
    return stack;
  }

  // Default behaviour is to ignore prepareStackTrace if it's not a function
  if (typeof customPrepareStackTrace !== 'function') {
    return stack;
  }

  error.stack = stack;
  try {
    return customPrepareStackTrace(error, safeStackTraces);
  } catch {
    // Default behaviour when prepareStackTrace crashes
    return error.toString();
  }
}
