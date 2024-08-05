export type Args = {
  removeInjectedLines: boolean;
  modifyWrongProxyAndObjectString: boolean;
  skipDuplicateSetPrototypeLines: boolean;
  applyStackTraceLimit: boolean;
};

const typedArgs = args as Args;

if (typeof self === 'undefined') {
  // We need to consider to migrate these scripts to functions to actually reflect how they are run
  // @ts-ignore
  return;
}

let stackTracelimit = Error.stackTraceLimit;
Error.stackTraceLimit = 200;

let customPrepareStackTrace: any | undefined;

const proxyThisTrackerHere = proxyThisTracker;
const proxyToTargetHere = proxyToTarget;
const getPrototypeSafeHere = getPrototypeSafe;
function prepareStackAndStackTraces(error: Error, stackTraces?: NodeJS.CallSite[]) {
  let stack = error.stack;
  stackTraces ??= [];
  const lines = stack.split('\n');
  const safeLines = [];
  const safeStackTraces = [];
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
    const stackTrace = stackTraces.at(i - 1);

    // First line doesnt count for limit
    if (safeLines.length > stackTracelimit && typedArgs.applyStackTraceLimit) break;

    if (setProtoTracker.has(error) && i === 1 && typedArgs.skipDuplicateSetPrototypeLines) continue;

    if (line.includes(sourceUrl) && typedArgs.removeInjectedLines) {
      continue;
    }

    const hideProxyLogic = () => {
      if (!typedArgs.modifyWrongProxyAndObjectString) return;
      if (!line.includes('Proxy') && !line.includes('Object')) return;

      const nextLine = lines.at(i + 1);
      if (!nextLine) return;

      const name = nextLine.trim().split(' ').at(1);
      if (!name?.includes('Internal-')) return;

      let originalThis = proxyThisTrackerHere.get(name);
      if (!originalThis) return;
      if (originalThis instanceof WeakRef) originalThis = originalThis.deref();

      let proxyTarget = originalThis;
      while (proxyTarget) {
        originalThis = proxyTarget;
        proxyTarget =
          proxyToTargetHere.get(originalThis) ??
          proxyToTargetHere.get(getPrototypeSafeHere(originalThis));
      }

      const replacement = typeof originalThis === 'function' ? 'Function' : 'Object';
      // Make sure to replace Object first, so we don't accidentally replace it.
      line = line.replace('Object', replacement);
      line = line.replace('Proxy', replacement);
    };

    hideProxyLogic();

    safeLines.push(line);
    if (stackTrace) {
      safeStackTraces.push(stackTrace);
    }
  }

  stack = safeLines.join('\n');
  return { stack, stackTraces: safeStackTraces };
}

Error.prepareStackTrace = (error, stackTraces) => {
  const { stack, stackTraces: safeStackTraces } = prepareStackAndStackTraces(error, stackTraces);

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
};

const ErrorDescriptor = ObjectCached.getOwnPropertyDescriptor(self, 'Error');
const ErrorProxy = internalCreateFnProxy({
  target: Error,
  inner: {
    get: (target, p, receiver) => {
      // Special property that other plugins can use to see if injected scripts are loaded
      if (p === sourceUrl) return true;
      if (p === 'prepareStackTrace') return customPrepareStackTrace;
      if (p === 'stackTraceLimit') return stackTracelimit;
      return ReflectCached.get(target, p, receiver);
    },
    set: (target, p, newValue, receiver) => {
      if (p === 'prepareStackTrace') {
        console.info('prepareStackTrace used by external user');
        customPrepareStackTrace = newValue;
        return true;
      }
      if (p === 'stackTraceLimit') {
        stackTracelimit = newValue;
        return true;
      }
      return ReflectCached.set(target, p, newValue, receiver);
    },
  },
});

ObjectCached.defineProperty(self, 'Error', {
  ...ErrorDescriptor,
  value: ErrorProxy,
});

proxyFunction(Error, 'captureStackTrace', (targetObj, thisArg, argArray) => {
  const [obj, ...rest] = argArray as any;
  const out = ReflectCached.apply(targetObj, thisArg, [obj, ...rest]);
  const { stack } = prepareStackAndStackTraces(obj);
  obj.stack = stack;
  return out;
});
