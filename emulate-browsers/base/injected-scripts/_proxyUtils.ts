/////// MASK TO STRING  ////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line prefer-const -- must be let: could change for different browser (ie, Safari)
let nativeToStringFunctionString = `${Function.toString}`;
// when functions are re-bound to work around the loss of scope issue in chromium, they blow up their native toString
const overriddenFns = new Map<Function, string>();

// eslint-disable-next-line no-extend-native
Object.defineProperty(Function.prototype, 'toString', {
  ...Object.getOwnPropertyDescriptor(Function.prototype, 'toString'),
  value: new Proxy(Function.prototype.toString, {
    apply(target: () => string, thisArg: any, args?: any): any {
      if (overriddenFns.has(thisArg)) {
        return overriddenFns.get(thisArg);
      }
      // from puppeteer-stealth: Check if the toString prototype of the context is the same as the global prototype,
      // if not indicates that we are doing a check across different windows
      const hasSameProto = Object.getPrototypeOf(Function.prototype.toString).isPrototypeOf(
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
          if (line.includes('Object.toString') && i === 1) {
            return line.replace('Object.toString', 'Function.toString');
          }
          return line;
        });
        throw error;
      }
    },
  }),
});
overriddenFns.set(Function.prototype.toString, nativeToStringFunctionString);

/////// END TOSTRING  //////////////////////////////////////////////////////////////////////////////////////////////////

// From puppeteer-stealth: this is to prevent someone snooping at Reflect calls
const ReflectCached = {
  construct: Reflect.construct.bind(Reflect),
  get: Reflect.get.bind(Reflect),
  set: Reflect.set.bind(Reflect),
  apply: Reflect.apply.bind(Reflect),
  ownKeys: Reflect.ownKeys.bind(Reflect),
  getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor.bind(Reflect),
};

enum ProxyOverride {
  callOriginal = '_____invoke_original_____',
}

declare let sourceUrl: string;

function cleanErrorStack(error: Error, replaceLineFn?: (line: string, index: number) => string) {
  if (!error.stack) return error;

  const split = error.stack.includes('\r\n') ? '\r\n' : '\n';
  const stack = error.stack.split(/\r?\n/);
  const newStack = [];
  for (let i = 0; i < stack.length; i += 1) {
    let line = stack[i];
    if (line.includes(sourceUrl)) {
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
  const descriptor = Object.getOwnPropertyDescriptor(owner, key);
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
    },
  });
  overriddenFns.set(descriptor.value, toString);
  Object.defineProperty(owner, key, descriptor);
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
    throw new Error(`Could not find descriptor for function: ${functionName}`);
  }
  const { descriptorOwner, descriptor } = descriptorInHierarchy;

  const toString = descriptor.value.toString();
  descriptorOwner[functionName] = new Proxy<any>(descriptorOwner[functionName], {
    apply(target, thisArg, argArray) {
      if (overrideOnlyForInstance === false || thisArg === thisObject) {
        try {
          const result = overrideFn(...arguments);
          if (result !== ProxyOverride.callOriginal) {
            if (result instanceof Promise && result.catch) {
              return result.catch(err => {
                throw cleanErrorStack(err);
              });
            }
            return result;
          }
        } catch (err) {
          throw cleanErrorStack(err);
        }
      }
      return ReflectCached.apply(...arguments);
    },
  });
  overriddenFns.set(descriptorOwner[functionName] as any, toString);
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
    throw new Error(`Could not find descriptor for getter: ${propertyName}`);
  }

  const { descriptorOwner, descriptor } = descriptorInHierarchy;
  const toString = descriptor.get.toString();
  descriptor.get = new Proxy(descriptor.get, {
    apply(_, thisArg) {
      if (overrideOnlyForInstance === false || thisArg === thisObject) {
        const result = overrideFn(...arguments);
        if (result !== ProxyOverride.callOriginal) return result;
      }
      return ReflectCached.apply(...arguments);
    },
  });
  overriddenFns.set(descriptor.get, toString);
  Object.defineProperty(descriptorOwner, propertyName, descriptor);
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
    throw new Error(`Could not find descriptor for setter: ${propertyName}`);
  }
  const { descriptorOwner, descriptor } = descriptorInHierarchy;
  const toString = descriptor.set.toString();
  descriptor.set = new Proxy(descriptor.set, {
    apply(target, thisArg, args) {
      if (!overrideOnlyForInstance || thisArg === thisObject) {
        const result = overrideFn(target as any, thisArg, ...args);
        if (result !== ProxyOverride.callOriginal) return result;
      }
      return ReflectCached.apply(...arguments);
    },
  });
  overriddenFns.set(descriptor.set, toString);
  Object.defineProperty(descriptorOwner, propertyName, descriptor);
  return descriptor.set;
}

function getDescriptorInHierarchy<T, K extends keyof T>(obj: T, prop: K) {
  let proto = obj;
  do {
    if (proto.hasOwnProperty(prop)) {
      return { descriptorOwner: proto, descriptor: Object.getOwnPropertyDescriptor(proto, prop) };
    }
    proto = Object.getPrototypeOf(proto);
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
  const descriptors = Object.getOwnPropertyDescriptors(owner);
  // if already exists, don't add again
  if (descriptors[propertyName]) {
    console.log(`Not re-adding descriptor for ${propertyName}`);
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
  for (const [key, existingDescriptor] of Object.entries(descriptors)) {
    if (hasPassedProperty) {
      // only way to reorder properties is to re-add them
      delete owner[key];
      Object.defineProperty(owner, key, existingDescriptor);
    }
    if (key === prevProperty) {
      Object.defineProperty(owner, propertyName, descriptor);
      hasPassedProperty = true;
    }
  }
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = {
    proxyFunction,
  };
}
