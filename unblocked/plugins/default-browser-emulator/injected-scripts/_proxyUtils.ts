/////// MASK TO STRING  ////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line prefer-const -- must be let: could change for different browser (ie, Safari)
let nativeToStringFunctionString = `${Function.toString}`;
// when functions are re-bound to work around the loss of scope issue in chromium, they blow up their native toString
const overriddenFns = new Map<Function, string>();
const proxyToTarget = new Map();

// From puppeteer-stealth: this is to prevent someone snooping at Reflect calls
const ReflectCached = {
  construct: Reflect.construct.bind(Reflect),
  get: Reflect.get.bind(Reflect),
  set: Reflect.set.bind(Reflect),
  apply: Reflect.apply.bind(Reflect),
  setPrototypeOf: Reflect.setPrototypeOf.bind(Reflect),
  ownKeys: Reflect.ownKeys.bind(Reflect),
  getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor.bind(Reflect),
};

const ObjectCached = {
  setPrototypeOf: Object.setPrototypeOf.bind(Object),
  getPrototypeOf: Object.getPrototypeOf.bind(Object),
  defineProperty: Object.defineProperty.bind(Object),
  entries: Object.entries.bind(Object),
  getOwnPropertyDescriptors: Object.getOwnPropertyDescriptors.bind(Object),
  getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor.bind(Object),
};

(function trackProxyInstances() {
  if (typeof self === 'undefined') return;
  const descriptor = ObjectCached.getOwnPropertyDescriptor(self, 'Proxy');
  const toString = descriptor.value.toString();
  descriptor.value = new Proxy(descriptor.value, {
    construct(target: any, argArray: any[], newTarget: Function): object {
      try {
        const result = ReflectCached.construct(target, argArray, newTarget);
        if (argArray?.length) proxyToTarget.set(result, argArray[0]);
        return result;
      } catch (err) {
        throw cleanErrorStack(err);
      }
    },
  });
  overriddenFns.set(descriptor.value, toString);
  ObjectCached.defineProperty(self, 'Proxy', descriptor);
})();

const fnToStringDescriptor = ObjectCached.getOwnPropertyDescriptor(Function.prototype, 'toString');
const fnToStringProxy = internalCreateFnProxy(
  Function.prototype.toString,
  fnToStringDescriptor,
  (target, thisArg, args) => {
    if (overriddenFns.has(thisArg)) {
      return overriddenFns.get(thisArg);
    }
    // from puppeteer-stealth: Check if the toString prototype of the context is the same as the global prototype,
    // if not indicates that we are doing a check across different windows
    const hasSameProto = ObjectCached.getPrototypeOf(Function.prototype.toString).isPrototypeOf(
      thisArg.toString,
    );
    if (hasSameProto === false) {
      // Pass the call on to the local Function.prototype.toString instead
      return thisArg.toString(...(args ?? []));
    }

    try {
      return target.apply(thisArg, args);
    } catch (error) {
      cleanErrorStack(error, (line, i) => {
        if (i === 1 && line.includes('Object.toString')) {
          const thisProto = ObjectCached.getPrototypeOf(thisArg);
          if (
            proxyToTarget.has(thisProto) &&
            (overriddenFns.has(thisProto) || overriddenFns.has(target))
          ) {
            return line.replace('Object.toString', 'Function.toString');
          }
        }
        return line;
      });
      throw error;
    }
  },
);

ObjectCached.defineProperty(Function.prototype, 'toString', {
  ...fnToStringDescriptor,
  value: fnToStringProxy,
});

/////// END TOSTRING  //////////////////////////////////////////////////////////////////////////////////////////////////

let isObjectSetPrototypeOf = false;
const nativeToStringObjectSetPrototypeOfString = `${Object.setPrototypeOf}`;
Object.setPrototypeOf = new Proxy(Object.setPrototypeOf, {
  apply(target: (o: any, proto: object | null) => any, thisArg: any, argArray: any[]): any {
    isObjectSetPrototypeOf = true;
    try {
      return ReflectCached.apply(...arguments);
    } catch (error) {
      throw cleanErrorStack(error);
    } finally {
      isObjectSetPrototypeOf = false;
    }
  },
});
overriddenFns.set(Object.setPrototypeOf, nativeToStringObjectSetPrototypeOfString);

enum ProxyOverride {
  callOriginal = '_____invoke_original_____',
}

declare let sourceUrl: string;

function cleanErrorStack(
  error: Error,
  replaceLineFn?: (line: string, index: number) => string,
  startAfterSourceUrl = false,
) {
  if (!error.stack) return error;

  const split = error.stack.includes('\r\n') ? '\r\n' : '\n';
  const stack = error.stack.split(/\r?\n/);
  const newStack = [];
  for (let i = 0; i < stack.length; i += 1) {
    let line = stack[i];
    if (line.includes(sourceUrl)) {
      if (startAfterSourceUrl === true) {
        newStack.length = 1;
      }
      continue;
    }
    if (replaceLineFn) line = replaceLineFn(line, i);
    newStack.push(line);
  }
  error.stack = newStack.join(split);
  return error;
}

function proxyConstructor<T, K extends keyof T>(
  owner: T,
  key: K,
  overrideFn: (
    target?: T[K],
    argArray?: T[K] extends new (...args: infer P) => any ? P : never[],
    newTarget?: T[K],
  ) => (T[K] extends new () => infer Z ? Z : never) | ProxyOverride,
) {
  const descriptor = ObjectCached.getOwnPropertyDescriptor(owner, key);
  const toString = descriptor.value.toString();
  descriptor.value = new Proxy(descriptor.value, {
    construct() {
      try {
        const result = overrideFn(...arguments);
        if (result !== ProxyOverride.callOriginal) {
          return result as any;
        }
      } catch (err) {
        throw cleanErrorStack(err);
      }
      return ReflectCached.construct(...arguments);
    },
  });
  overriddenFns.set(descriptor.value, toString);
  ObjectCached.defineProperty(owner, key, descriptor);
}

function internalCreateFnProxy(
  targetFn: any,
  descriptor: PropertyDescriptor,
  onApply: (target: any, thisArg: any, argArray: any[]) => any,
) {
  const toString = targetFn.toString();
  const proxy = new Proxy<any>(targetFn, {
    apply: onApply,
    setPrototypeOf(target: any, newPrototype: any): boolean {
      let protoTarget = newPrototype;
      if (newPrototype === proxy || newPrototype?.__proto__ === proxy) {
        protoTarget = target;
      }
      try {
        const caller = isObjectSetPrototypeOf ? ObjectCached : ReflectCached;
        return caller.setPrototypeOf(target, protoTarget);
      } catch (error) {
        throw cleanErrorStack(error);
      }
    },
    get(target: any, p: string | symbol, receiver: any): any {
      if (p === Symbol.hasInstance && receiver === proxy) {
        try {
          return target[Symbol.hasInstance].bind(target);
        } catch (err) {
          throw cleanErrorStack(err);
        }
      }

      return ReflectCached.get(target, p, receiver);
    },
    set(target: any, p: string | symbol, value: any, receiver: any): boolean {
      if (p === '__proto__') {
        let protoTarget = value;
        if (protoTarget === proxy || protoTarget?.__proto__ === proxy) {
          protoTarget = target;
        }
        try {
          return (target.__proto__ = protoTarget);
        } catch (error) {
          throw cleanErrorStack(error);
        }
      }
      return ReflectCached.set(...arguments);
    },
  });
  overriddenFns.set(proxy, toString);
  return proxy;
}

function proxyFunction<T, K extends keyof T>(
  thisObject: T,
  functionName: K,
  overrideFn: (
    target?: T[K],
    thisArg?: T,
    argArray?: T[K] extends (...args: infer P) => any ? P : never[],
  ) => (T[K] extends (...args: any[]) => infer Z ? Z : never) | ProxyOverride,
  overrideOnlyForInstance = false,
) {
  const descriptorInHierarchy = getDescriptorInHierarchy(thisObject, functionName);
  if (!descriptorInHierarchy) {
    throw new Error(`Could not find descriptor for function: ${String(functionName)}`);
  }
  const { descriptorOwner, descriptor } = descriptorInHierarchy;

  descriptorOwner[functionName] = internalCreateFnProxy(
    descriptorOwner[functionName],
    descriptor,
    (target, thisArg, argArray) => {
      const shouldOverride = overrideOnlyForInstance === false || thisArg === thisObject;
      const overrideFnToUse = shouldOverride ? overrideFn : null;
      return defaultProxyApply([target, thisArg, argArray], overrideFnToUse);
    },
  );
  return thisObject[functionName];
}

function proxyGetter<T, K extends keyof T>(
  thisObject: T,
  propertyName: K,
  overrideFn: (target?: T[K], thisArg?: T) => T[K] | ProxyOverride,
  overrideOnlyForInstance = false,
) {
  const descriptorInHierarchy = getDescriptorInHierarchy(thisObject, propertyName);
  if (!descriptorInHierarchy) {
    throw new Error(`Could not find descriptor for getter: ${String(propertyName)}`);
  }

  const { descriptorOwner, descriptor } = descriptorInHierarchy;

  descriptor.get = internalCreateFnProxy(
    descriptor.get,
    descriptor,
    (target, thisArg, argArray) => {
      const shouldOverride = overrideOnlyForInstance === false || thisArg === thisObject;
      const overrideFnToUse = shouldOverride ? overrideFn : null;
      return defaultProxyApply([target, thisArg, argArray], overrideFnToUse);
    },
  );
  ObjectCached.defineProperty(descriptorOwner, propertyName, descriptor);
  return descriptor.get;
}

function proxySetter<T, K extends keyof T>(
  thisObject: T,
  propertyName: K,
  overrideFn: (
    target?: T[K],
    thisArg?: T,
    value?: T[K] extends (value: infer P) => any ? P : never,
  ) => void | ProxyOverride,
  overrideOnlyForInstance = false,
) {
  const descriptorInHierarchy = getDescriptorInHierarchy(thisObject, propertyName);
  if (!descriptorInHierarchy) {
    throw new Error(`Could not find descriptor for setter: ${String(propertyName)}`);
  }
  const { descriptorOwner, descriptor } = descriptorInHierarchy;
  descriptor.set = internalCreateFnProxy(
    descriptor.set,
    descriptor,
    (target, thisArg, argArray) => {
      if (!overrideOnlyForInstance || thisArg === thisObject) {
        try {
          const result = overrideFn(target, thisArg, ...argArray);
          if (result !== ProxyOverride.callOriginal) return result;
        } catch (err) {
          throw cleanErrorStack(err);
        }
      }
      return ReflectCached.apply(target, thisArg, argArray);
    },
  );
  ObjectCached.defineProperty(descriptorOwner, propertyName, descriptor);
  return descriptor.set;
}

function defaultProxyApply<T, K extends keyof T>(
  args: [target: any, thisArg: T, argArray: any[]],
  overrideFn?: (target?: T[K], thisArg?: T, argArray?: any[]) => T[K] | ProxyOverride,
): any {
  if (overrideFn) {
    try {
      const result = overrideFn(...args);
      if (result !== ProxyOverride.callOriginal) {
        // @ts-expect-error
        if (result && result.then && result.catch) {
          // @ts-expect-error
          return result.catch((err) => {
            throw cleanErrorStack(err);
          });
        }
        return result;
      }
    } catch (err) {
      throw cleanErrorStack(err);
    }
  }
  return ReflectCached.apply(...args);
}

function getDescriptorInHierarchy<T, K extends keyof T>(obj: T, prop: K) {
  let proto = obj;
  do {
    if (!proto) return null;
    if (proto.hasOwnProperty(prop)) {
      return {
        descriptorOwner: proto,
        descriptor: ObjectCached.getOwnPropertyDescriptor(proto, prop),
      };
    }
    proto = ObjectCached.getPrototypeOf(proto);
  } while (proto);

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addDescriptorAfterProperty(
  path: string,
  prevProperty: string,
  propertyName: string,
  descriptor: PropertyDescriptor,
) {
  const owner = getObjectAtPath(path);
  if (!owner) {
    console.log(`ERROR: Parent for property descriptor not found: ${path} -> ${propertyName}`);
    return;
  }
  const descriptors = ObjectCached.getOwnPropertyDescriptors(owner);
  // if already exists, don't add again
  if (descriptors[propertyName]) {
    return;
  }

  const inHierarchy = getDescriptorInHierarchy(owner, propertyName);
  if (inHierarchy && descriptor.value) {
    if (inHierarchy.descriptor.get) {
      proxyGetter(owner, propertyName, () => descriptor.value, true);
    } else {
      throw new Error("Can't override descriptor that doesnt have a getter");
    }
    return;
  }

  let hasPassedProperty = false;
  for (const [key, existingDescriptor] of ObjectCached.entries(descriptors)) {
    if (hasPassedProperty) {
      // only way to reorder properties is to re-add them
      delete owner[key];
      ObjectCached.defineProperty(owner, key, existingDescriptor);
    }
    if (key === prevProperty) {
      ObjectCached.defineProperty(owner, propertyName, descriptor);
      hasPassedProperty = true;
    }
  }
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = {
    proxyFunction,
  };
}
