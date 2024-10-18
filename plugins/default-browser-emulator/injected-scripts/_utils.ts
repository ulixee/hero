export type UtilsInput = {
  sourceUrl: string;
  targetType: string;
  // TODO get this from agent interfaces
  callback: (name: string, data: string) => void;
};

export type ScriptInput<T extends Record<string, unknown> | never> = {
  utils: Exclude<ReturnType<typeof main>, undefined>;
  args: T;
} & UtilsInput;

export function main({ sourceUrl }: UtilsInput) {
  // Can be empty in some tests
  const hiddenKey = typeof sourceUrl === 'string' ? sourceUrl : 'testing';
  // Storage shared between multiple runs within the same frame/page/worker...
  // Needed to sync in some cases where our scripts run multiple times.
  type SharedStorage = { ready: boolean };
  const sharedStorage: SharedStorage = { ready: false };

  replaceFunction(Function.prototype, 'toString', (target, thisArg, argArray) => {
    if (argArray.at(0) === hiddenKey) return sharedStorage;
    const originalFn = toOriginalFn.get(thisArg);
    if (typeof originalFn === 'string') return originalFn;
    return ReflectCached.apply(target, originalFn ?? thisArg, argArray);
  });

  function getSharedStorage(): SharedStorage | undefined {
    try {
      return (Function.prototype.toString as any)(sourceUrl) as SharedStorage;
    } catch {
      return undefined;
    }
  }

  // Make sure we run our logic only once, see toString proxy for how this storage works.
  if (getSharedStorage()?.ready) {
    return;
  }

  // if (typeof module === 'object' && typeof module.exports === 'object') {
  //   module.exports = {
  //     proxyFunction,
  //     replaceFunction,
  //   };
  // }

  return {
    replaceFunction,
    replaceGetter,
    replaceSetter,
    ReflectCached,
    ObjectCached,
    proxyToTarget,
    toOriginalFn,
    addDescriptorAfterProperty,
    buildDescriptor,
    PathToInstanceTracker,
    getObjectAtPath,
    overriddenFns,
    nativeToStringFunctionString,
    getParentAndProperty,
    getDescriptorInHierarchy,
    invocationReturnOrThrow,
    OtherInvocationsTracker,
    reorderNonConfigurableDescriptors,
    reorderDescriptor,
    getSharedStorage,
  };
}

/* eslint-disable no-restricted-properties */

const ReflectCached: Pick<
  typeof Reflect,
  'construct' | 'get' | 'set' | 'apply' | 'setPrototypeOf' | 'ownKeys' | 'getOwnPropertyDescriptor'
> = {
  construct: Reflect.construct.bind(Reflect),
  get: Reflect.get.bind(Reflect),
  set: Reflect.set.bind(Reflect),
  apply: Reflect.apply.bind(Reflect),
  setPrototypeOf: Reflect.setPrototypeOf.bind(Reflect),
  ownKeys: Reflect.ownKeys.bind(Reflect),
  getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor.bind(Reflect),
};

const ErrorCached = Error;
const ObjectCached: Pick<
  ObjectConstructor,
  | 'setPrototypeOf'
  | 'getPrototypeOf'
  | 'getOwnPropertyNames'
  | 'defineProperty'
  | 'defineProperties'
  | 'create'
  | 'entries'
  | 'values'
  | 'keys'
  | 'getOwnPropertyDescriptors'
  | 'getOwnPropertyDescriptor'
  | 'hasOwn'
  | 'seal'
  | 'freeze'
> = {
  setPrototypeOf: Object.setPrototypeOf.bind(Object),
  getPrototypeOf: Object.getPrototypeOf.bind(Object),
  defineProperty: Object.defineProperty.bind(Object),
  defineProperties: Object.defineProperties.bind(Object),
  create: Object.create.bind(Object),
  entries: Object.entries.bind(Object),
  values: Object.values.bind(Object),
  keys: Object.keys.bind(Object),
  getOwnPropertyDescriptors: Object.getOwnPropertyDescriptors.bind(Object),
  getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor.bind(Object),
  getOwnPropertyNames: Object.getOwnPropertyNames.bind(Object),
  hasOwn: Object.hasOwn.bind(Object),
  seal: Object.seal.bind(Object),
  freeze: Object.freeze.bind(Object),
};

/* eslint-enable no-restricted-properties */

// We don't always have the original function (eg when creating a polyfil). In those
// cases we store toString instead.
const toOriginalFn = new Map<any, Function | string>();

type NewFunction = (target: any, thisArg: any, argArray: any[]) => any;

type ModifyDescriptorOpts = {
  descriptorKey: 'value' | 'get' | 'set';
  onlyForInstance?: Boolean;
};

function internalModifyDescriptor<T, K extends keyof T>(
  obj: T,
  key: K,
  newFunction: NewFunction,
  opts: ModifyDescriptorOpts,
) {
  const descriptorInHierarch = getDescriptorInHierarchy(obj, key);
  if (!descriptorInHierarch) throw new Error('prototype descriptor not found');

  const { descriptor, descriptorOwner } = descriptorInHierarch;
  const target = descriptor[opts.descriptorKey];

  const newDescriptor = {
    ...descriptor,
    // Keep function signature like this or we will mess up property descriptors (fn(){} != fn: function(){} != fn: ()=>{})
    [opts.descriptorKey](this: any, ...argArray) {
      // Make sure our prototypes match, if they dont either stuff has been modified, or we are doing
      // logic accross frames. In both cases forward logic to more specific targetFn.
      if (opts.descriptorKey === 'value') {
        const expectedFnProto = ObjectCached.getPrototypeOf(target);
        let receivedFnProto = expectedFnProto;
        try {
          receivedFnProto = ObjectCached.getPrototypeOf(this[key]);
        } catch {}
        if (expectedFnProto !== receivedFnProto) {
          return ReflectCached.apply(this[key], this, argArray);
        }
      }

      // onlyForInstance is needed so we can edit prototypes but only change behaviour for a single instance.
      // Editing prototypes is needed, because otherwise they can detect we changed this by checking instance === prototype.
      if (opts?.onlyForInstance && this !== obj) {
        return ReflectCached.apply(target, this, argArray);
      }
      return newFunction(target, this, argArray);
    },
  };

  // Get all descriptors of original function (get set is also a function internally)
  const originalValueDescriptors = ObjectCached.getOwnPropertyDescriptors(
    ObjectCached.getOwnPropertyDescriptor(descriptor, opts.descriptorKey)!.value,
  );
  // By defining these again we make sure we have all the correct properties set (eg name)
  ObjectCached.defineProperties(newDescriptor[opts.descriptorKey], originalValueDescriptors);
  ObjectCached.defineProperty(descriptorOwner, key, newDescriptor);

  toOriginalFn.set(newDescriptor[opts.descriptorKey], target);

  return newDescriptor;
}

export function replaceFunction<T, K extends keyof T>(
  obj: T,
  key: K,
  newFunction: NewFunction,
  opts: Omit<ModifyDescriptorOpts, 'descriptorKey'> = {},
) {
  return internalModifyDescriptor(obj, key, newFunction, { ...opts, descriptorKey: 'value' });
}

function replaceGetter<T, K extends keyof T>(
  obj: T,
  key: K,
  newFunction: NewFunction,
  opts: Omit<ModifyDescriptorOpts, 'descriptorKey'> = {},
) {
  return internalModifyDescriptor(obj, key, newFunction, { ...opts, descriptorKey: 'get' });
}

function replaceSetter<T, K extends keyof T>(
  obj: T,
  key: K,
  newFunction: NewFunction,
  opts: Omit<ModifyDescriptorOpts, 'descriptorKey'> = {},
) {
  return internalModifyDescriptor(obj, key, newFunction, { ...opts, descriptorKey: 'set' });
}

/////// MASK TO STRING  ////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line prefer-const -- must be let: could change for different browser (ie, Safari)
let nativeToStringFunctionString = `${Function.toString}`;
// when functions are re-bound to work around the loss of scope issue in chromium, they blow up their native toString
// Store undefined value to register overrides, but still keep native toString logic
const overriddenFns = new Map<Function, string | undefined>();
const proxyToTarget = new WeakMap();

// From puppeteer-stealth: this is to prevent someone snooping at Reflect calls

// Store External proxies as undefined so we can treat it as just missing
const proxyThisTracker = new Map<string, WeakRef<Object | Symbol> | any>([['External', undefined]]);

function getPrototypeSafe(obj: any): any {
  try {
    return ObjectCached.getPrototypeOf(obj);
  } catch {
    return undefined;
  }
}

function runAndInjectProxyInStack(target: any, thisArg: any, argArray: any, proxy: any) {
  const name =
    overriddenFns.has(proxy) || overriddenFns.has(getPrototypeSafe(proxy))
      ? `Internal-${Math.random()}`
      : 'External';

  if (name.includes('Internal')) {
    if (typeof proxy === 'object' || typeof proxy === 'symbol') {
      proxyThisTracker.set(name, new WeakRef(proxy));
    } else {
      proxyThisTracker.set(name, proxy);
    }
  }

  // This introduces an extra log line we can use to track proxy objects
  // by later mapping `Internal-${id}` to the value we stored in our map.
  const wrapper = {
    [name]() {
      return ReflectCached.apply(target, thisArg, argArray);
    },
  };

  return wrapper[name]();
}

(function trackProxyInstances() {
  if (typeof self === 'undefined') return;
  const descriptor = ObjectCached.getOwnPropertyDescriptor(self, 'Proxy');
  if (!descriptor) return;

  const OriginalProxy = Proxy;
  const originalProxyProperties = ObjectCached.getOwnPropertyDescriptors(Proxy);

  ObjectCached.defineProperty(self, 'Proxy', {
    // eslint-disable-next-line object-shorthand
    value: function Proxy(this, target, handler) {
      // eslint-disable-next-line strict
      'use strict';
      if (!new.target) {
        return ReflectCached.apply(OriginalProxy, this, [target, handler]);
      }

      const result = ReflectCached.construct(OriginalProxy, [target, handler], new.target);
      if (target && typeof target === 'object') proxyToTarget.set(result, target);
      return result;
    },
  });

  ObjectCached.defineProperties(Proxy, originalProxyProperties);
  Proxy.prototype.constructor = Proxy;
  toOriginalFn.set(Proxy, OriginalProxy);
})();

/////// END TOSTRING  //////////////////////////////////////////////////////////////////////////////////////////////////

function proxyConstructor<T, K extends keyof T>(
  owner: T,
  key: K,
  overrideFn: typeof ReflectCached.construct,
) {
  const descriptor = ObjectCached.getOwnPropertyDescriptor(owner, key);
  if (!descriptor) throw new Error(`Descriptor with key ${String(key)} not found`);

  const toString = descriptor.value.toString();
  descriptor.value = new Proxy(descriptor.value, {
    construct(target, argArray, newTarget) {
      return overrideFn(target, argArray, newTarget);
    },
  });
  overriddenFns.set(descriptor.value, toString);
  ObjectCached.defineProperty(owner, key, descriptor);
}

const setProtoTracker = new WeakSet<Error | any>();

function internalCreateFnProxy<T extends Function>(opts: {
  target: T;
  descriptor?: any;
  custom?: ProxyHandler<T>;
  inner?: ProxyHandler<T> & { fixThisArg?: boolean };
  disableStoreToString?: boolean;
}) {
  function apply(target: any, thisArg: any, argArray: any[]) {
    if (opts.inner?.apply) {
      return opts.inner.apply(target, thisArg, argArray);
    }
    return ReflectCached.apply(target, thisArg, argArray);
  }

  function setPrototypeOf(target: any, newPrototype: any): boolean {
    let protoTarget = newPrototype;
    let newPrototypeProto;
    try {
      newPrototypeProto = ObjectCached.getPrototypeOf(newPrototype);
    } catch {}
    if (newPrototype === proxy || newPrototypeProto === proxy) {
      protoTarget = target;
    }

    const temp = { stack: 'stack' };
    ErrorCached.captureStackTrace(temp);
    const stack = temp.stack.split('\n');

    const isFromReflect = stack.at(1)?.includes('Reflect.setPrototypeOf');
    try {
      const caller = isFromReflect ? ReflectCached : ObjectCached;
      return caller.setPrototypeOf(target, protoTarget);
    } catch (error) {
      setProtoTracker.add(error);
      throw error;
    }
  }

  function get(target: any, p: string | symbol, receiver: any): any {
    if (p === Symbol.hasInstance && receiver === proxy) {
      return target[Symbol.hasInstance].bind(target);
    }

    if (opts.inner?.get) {
      return opts.inner.get(target, p, receiver);
    }

    const value = opts.inner?.get
      ? opts.inner.get(target, p, receiver)
      : ReflectCached.get(target, p, receiver);

    if (typeof value === 'function') {
      return internalCreateFnProxy({
        target: value,
        inner: {
          fixThisArg: opts.inner?.fixThisArg,
          apply: (fnTarget, fnThisArg, fnArgArray) => {
            // Make sure we use the correct thisArg, but only for things that we didn't mean to replace
            // overriddenFns.has(fnTarget);
            // const proto = getPrototypeSafe(fnThisArg);
            // const shouldHide =
            //   overriddenFns.has(fnThisArg) || proto ? overriddenFns.has(proto) : false;
            if (opts.inner?.fixThisArg && fnThisArg === receiver) {
              return runAndInjectProxyInStack(fnTarget, target, fnArgArray, proxy);
            }
            return runAndInjectProxyInStack(fnTarget, fnThisArg, fnArgArray, proxy);
          },
        },
      });
    }
    return value;
  }

  function set(target: any, p: string | symbol, value: any, receiver: any): boolean {
    if (p === '__proto__') {
      let protoTarget = value;
      if (protoTarget === proxy || protoTarget?.__proto__ === proxy) {
        protoTarget = target;
      }
      return (target.__proto__ = protoTarget);
    }

    const result = opts.inner?.set
      ? opts.inner.set(target, p, value, receiver)
      : ReflectCached.set(target, p, value, receiver);
    return result;
  }

  const proxy = new Proxy(opts.target, {
    apply: opts.custom?.apply ?? apply,
    setPrototypeOf: opts.custom?.setPrototypeOf ?? setPrototypeOf,
    get: opts.custom?.get ?? get,
    set: opts.custom?.set ?? set,
  });

  if (proxy instanceof Function) {
    const toString = overriddenFns.get(opts.target as Function) ?? opts.target.toString();
    overriddenFns.set(proxy, toString);
    toOriginalFn.set(proxy, toString);
  }

  return proxy as any;
}

type OverrideFn = (target: Function, thisArg: any, argArray: any[]) => any;

function proxyFunction<T, K extends keyof T>(
  thisObject: T,
  functionName: K,
  overrideFn: OverrideFn,
  opts?: {
    overrideOnlyForInstance?: boolean;
    fixThisArg?: boolean;
  },
) {
  const descriptorInHierarchy = getDescriptorInHierarchy(thisObject, functionName);
  if (!descriptorInHierarchy) {
    throw new Error(`Could not find descriptor for function: ${String(functionName)}`);
  }
  const { descriptorOwner, descriptor } = descriptorInHierarchy;

  descriptorOwner[functionName] = internalCreateFnProxy({
    target: descriptorOwner[functionName] as Function,
    descriptor,
    inner: {
      apply: (target, thisArg, argArray) => {
        const shouldOverride = !opts?.overrideOnlyForInstance || thisArg === thisObject;
        if (shouldOverride) {
          return overrideFn(target, thisArg, argArray);
        }
        return ReflectCached.apply(target, thisArg, argArray);
      },
      fixThisArg: opts?.fixThisArg,
    },
  });
  return thisObject[functionName];
}

function proxyGetter<T, K extends keyof T>(
  thisObject: T,
  propertyName: K,
  overrideFn: OverrideFn,
  opts?: { overrideOnlyForInstance?: boolean },
) {
  const descriptorInHierarchy = getDescriptorInHierarchy(thisObject, propertyName);
  if (!descriptorInHierarchy) {
    throw new Error(`Could not find descriptor for getter: ${String(propertyName)}`);
  }

  const { descriptorOwner, descriptor } = descriptorInHierarchy;
  if (!descriptor.get) {
    throw new Error('Trying to apply a proxy getter on something that doesnt have a getter');
  }

  descriptor.get = internalCreateFnProxy({
    target: descriptor.get,
    descriptor,
    inner: {
      apply: (target, thisArg, argArray) => {
        const shouldOverride = !opts?.overrideOnlyForInstance || thisArg === thisObject;
        if (shouldOverride) {
          return overrideFn(target, thisArg, argArray);
        }
        return ReflectCached.apply(target, thisArg, argArray);
      },
    },
  });
  ObjectCached.defineProperty(descriptorOwner, propertyName, descriptor);
  return descriptor.get;
}

function proxySetter<T, K extends keyof T>(
  thisObject: T,
  propertyName: K,
  overrideFn: OverrideFn,
  opts?: { overrideOnlyForInstance?: boolean },
) {
  const descriptorInHierarchy = getDescriptorInHierarchy(thisObject, propertyName);
  if (!descriptorInHierarchy) {
    throw new Error(`Could not find descriptor for setter: ${String(propertyName)}`);
  }
  const { descriptorOwner, descriptor } = descriptorInHierarchy;
  if (!descriptor.set) {
    throw new Error('Trying to apply a proxy setter on something that doesnt have a setter');
  }

  descriptor.set = internalCreateFnProxy({
    target: descriptor.set,
    descriptor,
    inner: {
      apply: (target, thisArg, argArray) => {
        const shouldOverride = !opts?.overrideOnlyForInstance || thisArg === thisObject;
        if (shouldOverride) {
          return overrideFn(target, thisArg, argArray);
        }
        return ReflectCached.apply(target, thisArg, argArray);
      },
    },
  });
  ObjectCached.defineProperty(descriptorOwner, propertyName, descriptor);
  return descriptor.set;
}

function getDescriptorInHierarchy<T, K extends keyof T>(obj: T, prop: K) {
  let proto = obj;
  do {
    if (!proto) return null;
    const descriptor = ObjectCached.getOwnPropertyDescriptor(proto, prop);
    if (descriptor) {
      return {
        descriptorOwner: proto,
        descriptor,
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
      replaceGetter(owner, propertyName, () => descriptor.value, { onlyForInstance: true });
    } else {
      throw new Error("Can't override descriptor that doesnt have a getter");
    }
    return;
  }

  if (owner === self) {
    ObjectCached.defineProperty(owner, propertyName, descriptor);
    return reorderNonConfigurableDescriptors(path, propertyName, prevProperty, propertyName);
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

const reordersByObject = new WeakMap<
  any,
  { propertyName: string; prevProperty: string; throughProperty: string }[]
>();

replaceFunction(Object, 'getOwnPropertyDescriptors', (target, thisArg, argArray) => {
  const descriptors = ReflectCached.apply(target, thisArg, argArray) as ReturnType<
    ObjectConstructor['getOwnPropertyDescriptors']
  >;
  const reorders = reordersByObject.get(thisArg) ?? reordersByObject.get(argArray.at(0));
  if (reorders) {
    const keys = ObjectCached.keys(descriptors);
    for (const { propertyName, prevProperty, throughProperty } of reorders) {
      adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
    }
    const finalDescriptors = {};
    for (const key of keys) {
      finalDescriptors[key] = descriptors[key];
    }
    return finalDescriptors;
  }
  return descriptors;
});

replaceFunction(Object, 'getOwnPropertyNames', (target, thisArg, argArray) => {
  const keys = ReflectCached.apply(target, thisArg!, argArray!);

  const reorders = reordersByObject.get(thisArg) ?? reordersByObject.get(argArray.at(0));
  if (reorders) {
    for (const { propertyName, prevProperty, throughProperty } of reorders) {
      adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
    }
  }
  return keys;
});

replaceFunction(Object, 'keys', (target, thisArg, argArray) => {
  const keys = ReflectCached.apply(target, thisArg!, argArray!);

  const reorders = reordersByObject.get(thisArg) ?? reordersByObject.get(argArray.at(0));
  if (reorders) {
    for (const { propertyName, prevProperty, throughProperty } of reorders) {
      adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
    }
  }
  return keys;
});

function reorderNonConfigurableDescriptors(
  objectPath,
  propertyName,
  prevProperty,
  throughProperty,
) {
  const objectAtPath = getObjectAtPath(objectPath);
  if (!reordersByObject.has(objectAtPath)) reordersByObject.set(objectAtPath, []);
  const reorders = reordersByObject.get(objectAtPath)!;
  reorders.push({ prevProperty, propertyName, throughProperty });
}

function reorderDescriptor(path, propertyName, prevProperty, throughProperty) {
  const owner = getObjectAtPath(path);

  const descriptor = ObjectCached.getOwnPropertyDescriptor(owner, propertyName);
  if (!descriptor) {
    console.log(`Can't redefine a non-existent property descriptor: ${path} -> ${propertyName}`);
    return;
  }
  const prevDescriptor = ObjectCached.getOwnPropertyDescriptor(owner, prevProperty);
  if (!prevDescriptor) {
    console.log(
      `Can't redefine a non-existent prev property descriptor: ${path} -> ${propertyName}, prev =${prevProperty}`,
    );
    return;
  }

  const descriptors = ObjectCached.getOwnPropertyDescriptors(owner);
  const keys = ObjectCached.keys(owner);
  adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);

  for (const key of keys) {
    const keyDescriptor = descriptors[key];
    delete owner[key];
    ObjectCached.defineProperty(owner, key, keyDescriptor);
  }
}

function adjustKeyOrder(keys, propertyName, prevProperty, throughProperty) {
  const currentIndex = keys.indexOf(propertyName);
  const throughPropIndex = keys.indexOf(throughProperty) - currentIndex + 1;
  const props = keys.splice(currentIndex, throughPropIndex);
  keys.splice(keys.indexOf(prevProperty) + 1, 0, ...props);
}

const nativeErrorRegex = new RegExp(/^(\w+):\s/);

const globalSymbols = {};
for (const symbol of ReflectCached.ownKeys(Symbol)) {
  if (typeof Symbol[symbol] === 'symbol') {
    globalSymbols[`${String(Symbol[symbol])}`] = Symbol[symbol];
  }
}

function createError(message: string, type?: { new (msg: string): any }) {
  if (!type) {
    const match = nativeErrorRegex.exec(message);
    if (match?.length) {
      message = message.replace(`${match[1]}: `, '');
      try {
        type = self[match[1]];
      } catch (err) {
        // ignore
      }
    }
  }
  if (!type) type = Error;
  // eslint-disable-next-line new-cap
  const errType = new type(message);
  return errType;
}

function newObjectConstructor(
  newProps: IDescriptor,
  path: string,
  invocation?: string | Function,
  isAsync?: boolean,
) {
  return function () {
    if (newProps._$constructorException) {
      throw createError(newProps._$constructorException);
    }

    if (
      !new.target &&
      invocation &&
      !newProps['_$$value()'] &&
      !ObjectCached.values(newProps).some(x => x['_$$value()'])
    ) {
      if (typeof invocation === 'function') return invocation(...arguments);
      return invocationReturnOrThrow(invocation, isAsync);
    }
    const props = ObjectCached.entries(newProps);
    const obj = {};
    if (!newProps._$protos) throw new Error('newProps._$protos undefined');
    ObjectCached.setPrototypeOf(
      obj,
      prototypesByPath[newProps._$protos[0]] ?? getObjectAtPath(newProps._$protos[0]),
    );
    for (const [prop, value] of props) {
      if (prop.startsWith('_$')) continue;
      let propName: string | symbol = prop;
      if (propName.startsWith('Symbol(')) {
        propName = Symbol.for(propName.match(/Symbol\((.+)\)/)![1]);
      }
      ObjectCached.defineProperty(obj, propName, buildDescriptor(value, `${path}.${prop}`));
    }
    return obj;
  };
}

const prototypesByPath: { [path: string]: PropertyDescriptor } = {};

function buildDescriptor(entry: IDescriptor, path: string): PropertyDescriptor {
  const attrs: PropertyDescriptor = {};
  const flags = entry._$flags || '';
  if (flags.includes('c')) attrs.configurable = true;
  if (flags.includes('w')) attrs.writable = true;
  if (flags.includes('e')) attrs.enumerable = true;

  if (entry._$get) {
    attrs.get = new Proxy(Function.prototype.call.bind({}), {
      apply() {
        if (entry._$accessException) throw createError(entry._$accessException);
        if (entry._$value) return entry._$value;
        if (entry['_$$value()']) return entry['_$$value()']();
      },
    });
    overriddenFns.set(attrs.get!, entry._$get);
    toOriginalFn.set(attrs.get!, entry._$get);
  } else if (entry['_$$value()']) {
    attrs.value = entry['_$$value()']();
  } else if (entry._$value !== undefined) {
    attrs.value = entry._$value;
  }

  if (entry._$set) {
    attrs.set = new Proxy(Function.prototype.call.bind({}), {
      apply() {},
    });
    overriddenFns.set(attrs.set!, entry._$set);
    toOriginalFn.set(attrs.set!, entry._$set);
  }

  let prototypeDescriptor: PropertyDescriptor | undefined;
  if (entry.prototype) {
    prototypeDescriptor = buildDescriptor(entry.prototype, `${path}.prototype`);

    if (!entry.prototype._$flags || !entry.prototype._$flags.includes('w')) {
      prototypeDescriptor.writable = false;
    }
    if (entry._$function) {
      overriddenFns.set(prototypeDescriptor.value.constructor, entry._$function);
      toOriginalFn.set(attrs.set!, entry._$set);
    }
    prototypesByPath[`${path}.prototype`] = prototypeDescriptor.value;
  }

  // do after prototypes are created
  if (entry._$function) {
    const newProps = entry['new()'];
    if (newProps) {
      attrs.value = newObjectConstructor(newProps, path, entry._$invocation, entry._$isAsync);
    } else {
      ObjectCached.keys(entry)
        .filter((key): key is OtherInvocationKey => key.startsWith('_$otherInvocation'))
        // Not supported currently
        .filter(key => !key.includes('new()'))
        .forEach(key => OtherInvocationsTracker.addOtherInvocation(path, key, entry[key]));

      // use function call just to get a function that doesn't create prototypes on new
      // bind to an empty object so we don't modify the original
      attrs.value = new Proxy(Function.prototype.call.bind({}), {
        apply(_target, thisArg) {
          const invocation =
            OtherInvocationsTracker.getOtherInvocation(path, thisArg)?.invocation ??
            entry._$invocation;
          return invocationReturnOrThrow(invocation, entry._$isAsync);
        },
      });
    }
    if (entry._$invocation !== undefined) {
      ObjectCached.setPrototypeOf(attrs.value, Function.prototype);
      delete attrs.value.prototype;
      delete attrs.value.constructor;
    }

    if (prototypeDescriptor && newProps) {
      ObjectCached.defineProperty(prototypeDescriptor.value, 'constructor', {
        value: attrs.value,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
    overriddenFns.set(attrs.value, entry._$function);
    toOriginalFn.set(attrs.value, entry._$function);
  }

  if (typeof entry === 'object') {
    const props = ObjectCached.entries(entry).filter(([prop]) => !prop.startsWith('_$'));
    if (!attrs.value && (props.length || entry._$protos)) {
      attrs.value = {};
    }
    if (entry._$protos) {
      const proto = prototypesByPath[entry._$protos[0]] ?? getObjectAtPath(entry._$protos[0]);
      attrs.value = ObjectCached.setPrototypeOf(attrs.value, proto);
    }

    for (const [prop, value] of props) {
      if (prop.startsWith('_$') || prop === 'new()') continue;
      if (prop === 'arguments' || prop === 'caller') continue;
      let propName: string | number | symbol = prop;
      if (propName.startsWith('Symbol(')) {
        propName = globalSymbols[propName];
        if (!propName) {
          const symbolName = (propName as string).match(/Symbol\((.+)\)/)![1];
          propName = Symbol.for(symbolName);
        }
      }
      let descriptor: PropertyDescriptor;
      if (propName === 'prototype') {
        descriptor = prototypeDescriptor!;
      } else {
        descriptor = buildDescriptor(value, `${path}.${prop}`);
      }
      ObjectCached.defineProperty(attrs.value, propName, descriptor);
    }
  }

  return attrs;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getParentAndProperty(path: string) {
  const parts = breakdownPath(path, 1);
  if (!parts) return undefined;
  return { parent: parts.parent, property: parts.remainder[0] };
}

function breakdownPath(path: string, propsToLeave) {
  if (!path || path.startsWith('detached')) {
    // can't do these yet... need to know how to get to them (ie, super prototype of X)
    return undefined;
  }

  const parts = path.split(/\.Symbol\(([\w.]+)\)|\.(\w+)/).filter(Boolean);
  let obj: any = self;
  while (parts.length > propsToLeave) {
    let next: string | symbol | undefined = parts.shift();
    if (next === undefined) throw new Error('Reached end of parts without finding obj');
    if (next === 'window') continue;
    if (next?.startsWith('Symbol.')) next = Symbol.for(next);
    obj = obj[next];
    if (!obj) {
      throw new Error(`Property not found -> ${path} at ${String(next)}`);
    }
  }
  return { parent: obj, remainder: parts };
}

function getObjectAtPath(path) {
  const parts = breakdownPath(path, 0);
  if (!parts) return undefined;
  return parts.parent;
}

function invocationToMaybeError(invocation: any): Error | undefined {
  if (typeof invocation !== 'string') {
    return;
  }
  const errorType = invocation.match(/(\w+Error): (.+)/);
  if (!errorType) {
    return;
  }

  if (errorType) {
    return createError(invocation);
  }
}

function invocationReturnOrThrow(invocation: any, isAsync?: boolean): any | Promise<any> {
  const error = invocationToMaybeError(invocation);
  if (isAsync && error) return Promise.reject(error);
  if (isAsync) return Promise.resolve(invocation);
  if (error) throw error;
  return invocation;
}

type OtherInvocationInfo = `` | `Async`;
type OtherInvocationKey = `_$otherInvocation${OtherInvocationInfo}.${string}`;

declare interface IDescriptor {
  _$flags: string;
  _$type: string;
  _$get?: any;
  _$set?: any;
  _$accessException?: string;
  _$constructorException?: string;
  _$value?: string;
  '_$$value()'?: () => string;
  _$function?: string;
  _$invocation?: string;
  _$isAsync?: boolean;
  [key: OtherInvocationKey]: string;
  _$protos?: string[];
  'new()'?: IDescriptor;
  prototype: IDescriptor;
}

// Base Path and Other Path combined for efficient indexing
type OtherInvocationWithBaseKey = `${string}...${string}`;

/**
 * This tracks all other invocations of a prototype functions. This means we use the same prototype but have
 * bound/used a different 'this' object which could result in a different output.
 */
class OtherInvocationsTracker {
  static basePaths = new Set<string>();
  private static otherInvocations = new Map<
    OtherInvocationWithBaseKey,
    { invocation: any; isAsync: boolean }
  >();

  static addOtherInvocation(basePath: string, otherKey: OtherInvocationKey, otherInvocation: any) {
    const [invocationKey, ...otherParts] = otherKey.split('.');
    // Remove key/property from path
    const otherPath = otherParts.slice(0, -1).join('.');
    // Store this path so we can later check if we have the reference we expect
    PathToInstanceTracker.addPath(otherPath);
    this.basePaths.add(basePath);
    this.otherInvocations.set(this.key(basePath, otherPath), {
      invocation: otherInvocation,
      isAsync: invocationKey.includes('Async'),
    });
  }

  static getOtherInvocation(
    basePath: string,
    otherThis: any,
  ): { invocation: any; path: string; isAsync?: boolean } | undefined {
    const otherPath = PathToInstanceTracker.getPath(otherThis);
    if (!otherPath) {
      return;
    }

    const info = this.otherInvocations.get(this.key(basePath, otherPath));
    return {
      path: otherPath,
      invocation: info?.invocation,
      isAsync: info?.isAsync,
    };
  }

  private static key(basePath: string, otherPath: string): OtherInvocationWithBaseKey {
    return `${basePath}....${otherPath}`;
  }
}

/**
 * At runtime we need to check if instances of objects are equal to the original ones. Just doing
 * if instance == orginal wont work since we will be modifying original instances. Each plugin
 * doesn't know about the others so it has no way of tracking original instances. To solve this we store all
 * paths of instances we will need later and refresh instances when done modify. Refreshing should be done
 * after all plugins are done modifying original instances, calling this multiple times before that is also possible
 * if it is needed earlier.
 */
class PathToInstanceTracker {
  private static pathsToTrack = new Set<string>();
  private static instanceToPath = new Map<any, string>();

  static addPath(path: string) {
    this.pathsToTrack.add(path);
  }

  static getPath(instance: any) {
    return this.instanceToPath.get(instance);
  }

  static updateAllReferences() {
    this.instanceToPath.clear();
    for (const path of this.pathsToTrack) {
      this.instanceToPath.set(this.getInstanceForPath(path), path);
    }
  }

  private static getInstanceForPath(path: string) {
    const result = getParentAndProperty(path);
    if (!result) throw new Error('no parent and property found');
    const { parent, property } = result;
    return parent[property];
  }
}
