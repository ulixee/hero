// eslint-disable-next-line prefer-const -- must be let: could change for different browser (ie, Safari)
let nativeToStringFunctionString = Error.toString().replace(/Error/g, 'toString');

// when functions are re-bound to work around the loss of scope issue in chromium, they blow up their native toString
const definedFuncs = new Map();

// From puppeteer-stealth: this is to prevent someone snooping at Reflect calls
const ReflectCached = {
  construct: Reflect.construct.bind(Reflect),
  get: Reflect.get.bind(Reflect),
  set: Reflect.set.bind(Reflect),
  apply: Reflect.apply.bind(Reflect),
  ownKeys: Reflect.ownKeys.bind(Reflect),
  getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor.bind(Reflect),
};

const nativeErrorRegex = new RegExp(/^(\w+):\s/);

const globalSymbols = {};
for (const symbol of ReflectCached.ownKeys(Symbol)) {
  if (typeof Symbol[symbol] === 'symbol') {
    globalSymbols[`${String(Symbol[symbol])}`] = Symbol[symbol];
  }
}

const nativeKey = '_____native_____';

/////// END CONST //////////////////////////////////////////////////////////////////////////////////////////////////////

function createError(message, type) {
  if (!type) {
    const match = nativeErrorRegex.exec(message);
    if (match.length) {
      message = message.replace(`${match[1]}: `, '');
      try {
        type = window[match[1]];
      } catch (err) {
        // ignore
      }
    }
  }
  if (!type) type = Error;
  // eslint-disable-next-line new-cap
  return new type(message);
}

proxyFunction(Function.prototype, 'toString', (target, thisArg, ...args) => {
  if (definedFuncs.has(thisArg)) {
    return definedFuncs.get(thisArg);
  }
  if (target === Function.prototype.toString) {
    return nativeToStringFunctionString;
  }
  return target.apply(thisArg, args);
});

function newObjectConstructor(newProps) {
  return function() {
    if (typeof newProps === 'string') {
      throw createError(newProps);
    }
    Object.setPrototypeOf(this, getObjectAtPath(newProps._protos[0]));
    const props = Object.entries(newProps);
    const obj = {};
    for (const [prop, value] of props) {
      if (prop.startsWith('_')) continue;
      let propName = prop;
      if (propName.startsWith('Symbol(')) {
        propName = Symbol.for(propName.match(/Symbol\((.+)\)/)[1]);
      }
      Object.defineProperty(obj, propName, buildDescriptor(value));
    }
    return obj;
  };
}

function buildDescriptor(entry) {
  const attrs = {};
  const flags = entry._flags || '';
  if (flags.includes('c')) attrs.configurable = true;
  if (flags.includes('w')) attrs.writable = true;
  if (flags.includes('e')) attrs.enumerable = true;

  if (entry._get) {
    attrs.get = new Proxy(Function.prototype.call.bind({}), {
      apply() {
        if (entry._accessException) throw createError(entry._accessException);
        if (entry._value) return entry._value;
        if (entry['_value()']) return entry['_value()']();
      },
    });
    definedFuncs.set(attrs.get, entry._get);
  } else if (entry['_value()']) {
    attrs.value = entry['_value()']();
  } else if (entry._value !== undefined) {
    attrs.value = entry._value;
  }

  if (entry._set) {
    attrs.set = new Proxy(Function.prototype.call.bind({}), {
      apply() {},
    });
    definedFuncs.set(attrs.set, entry._set);
  }

  if (entry._function) {
    const newProps = entry['new()'];
    if (!newProps) {
      // use function call just to get a function that doesn't create prototypes on new
      // bind to an empty object so we don't modify the original
      attrs.value = new Proxy(Function.prototype.call.bind({}), {
        apply() {
          return entry._invocation;
        },
      });
    } else {
      attrs.value = newObjectConstructor(newProps);
    }
    if (entry._invocation !== undefined) {
      Object.setPrototypeOf(attrs.value, Function.prototype);
      delete attrs.value.prototype;
      delete attrs.value.constructor;
    }
    definedFuncs.set(attrs.value, entry._function);
  }

  if (typeof entry === 'object') {
    const props = Object.entries(entry).filter(([prop]) => prop[0] !== '_');
    if (!attrs.value && (props.length || entry._protos)) {
      attrs.value = {};
    }
    if (entry._protos) {
      attrs.value = Object.setPrototypeOf(attrs.value, getObjectAtPath(entry._protos[0]));
    }

    for (const [prop, value] of props) {
      if (prop[0] === '_') continue;
      if (prop === 'arguments' || prop === 'caller') continue;
      let propName = prop;
      if (propName.startsWith('Symbol(')) {
        propName = globalSymbols[propName];
        if (!propName) {
          const symbolName = propName.match(/Symbol\((.+)\)/)[1];
          propName = Symbol.for(symbolName);
        }
      }
      const descriptor = buildDescriptor(value);
      if (propName === 'prototype') {
        Object.defineProperty(descriptor.value, 'constructor', {
          value: newObjectConstructor(props),
          writable: true,
          enumerable: false,
          configurable: true,
        });
        if (!entry.prototype._flags || !entry.prototype._flags.includes('w')) {
          descriptor.writable = false;
        }
        if (entry._function) {
          definedFuncs.set(descriptor.value.constructor, entry._function);
        }
      }
      Object.defineProperty(attrs.value, propName, descriptor);
    }
  }

  return attrs;
}

function cleanErrorStack(error) {
  const stack = error.stack.split(/\r?\n/);
  const newStack = [];
  for (let i = 0; i < stack.length; i += 1) {
    if (stack[i].includes(sourceUrl)) {
      continue;
    }
    newStack.push(stack[i]);
  }
  error.stack = newStack.join('\n');
  return error;
}

function proxyFunction(thisObject, functionName, replacementFunc) {
  const overrides = proxyDescriptors(thisObject, {
    [functionName]: {
      global: true,
      func(target, thisArg, argArray) {
        try {
          const result = replacementFunc(target, thisArg, ...argArray);
          if (result && result.catch) {
            return result.catch(err => {
              throw cleanErrorStack(err);
            });
          }
          return result;
        } catch (err) {
          throw cleanErrorStack(err);
        }
      },
    },
  });
  if (!overrides.length) throw new Error(`Could not override function ${functionName}`);
}

function proxyDescriptors(obj, props) {
  let proto = obj;
  const propLength = Object.keys(props).length;
  const overrides = [];
  while (proto) {
    const descriptors = Object.getOwnPropertyDescriptors(proto);
    for (const [key, descriptor] of Object.entries(descriptors)) {
      const override = props.hasOwnProperty(key) ? props[key] : undefined;
      if (!override || overrides.includes(key)) {
        Object.defineProperty(proto, key, descriptor);
        continue;
      }

      overrides.push(key);
      if (override.get) {
        overrideGet(obj, proto, key, descriptor, override);
      }
      if (override.set) {
        overrideSet(obj, proto, key, descriptor, override);
      }
      if (override.func) {
        overrideFunction(obj, proto, key, descriptor, override);
      }
    }
    if (overrides.length === propLength) break;
    proto = Object.getPrototypeOf(proto);
  }

  return overrides;
}

function overrideGet(obj, proto, key, descriptor, override) {
  const toString = descriptor.get.toString();
  descriptor.get = new Proxy(descriptor.get, {
    apply(_, thisArg) {
      if (override.global || thisArg === obj) {
        const result = override.get(...arguments);
        if (result !== nativeKey) return result;
      }
      return ReflectCached.apply(...arguments);
    },
  });
  definedFuncs.set(descriptor.get, toString);
  Object.defineProperty(proto, key, descriptor);
}

function overrideSet(obj, proto, key, descriptor, override) {
  const toString = descriptor.set.toString();
  descriptor.set = new Proxy(descriptor.set, {
    apply(_, thisArg) {
      if (override.global || thisArg === obj) {
        const result = override.set(...arguments);
        if (result !== nativeKey) return result;
      }
      return ReflectCached.apply(...arguments);
    },
  });
  definedFuncs.set(descriptor.set, toString);
  Object.defineProperty(proto, key, descriptor);
}

function overrideFunction(obj, proto, key, descriptor, override) {
  if (typeof proto[key] !== 'function') {
    throw new Error(`Trying to override function that's not a function! - ${key}`);
  }
  const toString = proto[key].toString();
  proto[key] = new Proxy(proto[key], {
    apply(target, thisArg) {
      if (override.global || thisArg === obj) {
        const result = override.func(...arguments);
        if (result !== nativeKey) return result;
      }
      return ReflectCached.apply(...arguments);
    },
  });
  definedFuncs.set(proto[key], toString);
}

function getDescriptorInHierarchy(obj, prop) {
  let proto = obj;
  do {
    if (proto.hasOwnProperty(prop)) {
      return { proto, descriptor: Object.getOwnPropertyDescriptor(proto, prop) };
    }
    proto = Object.getPrototypeOf(proto);
  } while (proto);

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getParentAndProperty(path) {
  const parts = breakdownPath(path, 1);
  if (!parts) return undefined;
  return { parent: parts.parent, property: parts.remainder[0] };
}

function breakdownPath(path, propsToLeave) {
  if (!path || path.startsWith('detached')) {
    // can't do these yet... need to know how to get to them (ie, super prototype of X)
    return undefined;
  }

  const parts = path.split(/\.Symbol\(([\w.]+)\)|\.(\w+)/).filter(Boolean);
  let obj = window;
  while (parts.length > propsToLeave) {
    let next = parts.shift();
    if (next === 'window') continue;
    if (next.startsWith('Symbol.')) next = Symbol.for(next);
    obj = obj[next];
    if (!obj) {
      throw new Error(`Property not found -> ${path} at ${next}`);
    }
  }
  return { parent: obj, remainder: parts };
}

function getObjectAtPath(path) {
  const parts = breakdownPath(path, 0);
  if (!parts) return undefined;
  return parts.parent;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function reorderDescriptor(path, propertyName, prevProperty, throughProperty) {
  const owner = getObjectAtPath(path);

  const descriptor = Object.getOwnPropertyDescriptor(owner, propertyName);
  if (!descriptor) {
    console.log(`Can't redefine a non-existent property descriptor: ${path} -> ${propertyName}`);
    return;
  }
  const prevDescriptor = Object.getOwnPropertyDescriptor(owner, prevProperty);
  if (!prevDescriptor) {
    console.log(
      `Can't redefine a non-existent prev property descriptor: ${path} -> ${propertyName}, prev =${prevProperty}`,
    );
    return;
  }

  const descriptors = Object.getOwnPropertyDescriptors(owner);
  const keys = Object.keys(owner);
  adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);

  for (const key of keys) {
    const keyDescriptor = descriptors[key];
    delete owner[key];
    Object.defineProperty(owner, key, keyDescriptor);
  }
}

function adjustKeyOrder(keys, propertyName, prevProperty, throughProperty) {
  const currentIndex = keys.indexOf(propertyName);
  const throughPropIndex = keys.indexOf(throughProperty) - currentIndex + 1;
  const props = keys.splice(currentIndex, throughPropIndex);
  keys.splice(keys.indexOf(prevProperty) + 1, 0, ...props);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addDescriptorAfterProperty(path, prevProperty, propertyName, descriptor) {
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
      const result = proxyDescriptors(owner, {
        [propertyName]: {
          get: () => descriptor.value,
        },
      });
      if (!result.includes(propertyName))
        throw new Error(`Failed to override descriptor: ${propertyName}`);
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

if (typeof window === 'undefined') {
  module.exports = {
    proxyFunction,
  };
}
