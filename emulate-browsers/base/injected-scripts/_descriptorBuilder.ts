const nativeErrorRegex = new RegExp(/^(\w+):\s/);

const globalSymbols = {};
for (const symbol of ReflectCached.ownKeys(Symbol)) {
  if (typeof Symbol[symbol] === 'symbol') {
    globalSymbols[`${String(Symbol[symbol])}`] = Symbol[symbol];
  }
}

function createError(message: string, type?: { new (message: string): any }) {
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

function newObjectConstructor(newProps: IDescriptor) {
  return function() {
    if (typeof newProps === 'string') {
      throw createError(newProps);
    }
    Object.setPrototypeOf(this, getObjectAtPath(newProps._protos[0]));
    const props = Object.entries(newProps);
    const obj = {};
    for (const [prop, value] of props) {
      if (prop.startsWith('_')) continue;
      let propName: string | symbol = prop;
      if (propName.startsWith('Symbol(')) {
        propName = Symbol.for(propName.match(/Symbol\((.+)\)/)[1]);
      }
      Object.defineProperty(obj, propName, buildDescriptor(value));
    }
    return obj;
  };
}

function buildDescriptor(entry: IDescriptor) {
  const attrs: PropertyDescriptor = {};
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
    overriddenFns.set(attrs.get, entry._get);
  } else if (entry['_value()']) {
    attrs.value = entry['_value()']();
  } else if (entry._value !== undefined) {
    attrs.value = entry._value;
  }

  if (entry._set) {
    attrs.set = new Proxy(Function.prototype.call.bind({}), {
      apply() {},
    });
    overriddenFns.set(attrs.set, entry._set);
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
    overriddenFns.set(attrs.value, entry._function);
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
      let propName: string | number | symbol = prop;
      if (propName.startsWith('Symbol(')) {
        propName = globalSymbols[propName];
        if (!propName) {
          const symbolName = (propName as string).match(/Symbol\((.+)\)/)[1];
          propName = Symbol.for(symbolName);
        }
      }
      const descriptor = buildDescriptor(value);
      if (propName === 'prototype') {
        Object.defineProperty(descriptor.value, 'constructor', {
          // Blake: changed this from props on TS. is it right?
          value: newObjectConstructor(value),
          writable: true,
          enumerable: false,
          configurable: true,
        });
        if (!entry.prototype._flags || !entry.prototype._flags.includes('w')) {
          descriptor.writable = false;
        }
        if (entry._function) {
          overriddenFns.set(descriptor.value.constructor, entry._function);
        }
      }
      Object.defineProperty(attrs.value, propName, descriptor);
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
  let obj: any = window;
  while (parts.length > propsToLeave) {
    let next: string | symbol = parts.shift();
    if (next === 'window') continue;
    if (next.startsWith('Symbol.')) next = Symbol.for(next);
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

declare interface IDescriptor {
  _flags: string;
  _type: string;
  _get?: any;
  _set?: any;
  _accessException?: string;
  _value?: string;
  '_value()'?: () => string;
  _function?: string;
  _invocation?: string;
  _protos?: string[];
  'new()'?: IDescriptor;
  prototype: IDescriptor;
}
