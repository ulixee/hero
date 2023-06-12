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
    if (match.length) {
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
  return cleanErrorStack(errType);
}

function newObjectConstructor(newProps: IDescriptor, path: string, invocation?: string | Function) {
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
      if (invocation.startsWith('TypeError'))
        throw new TypeError(invocation.replace('TypeError: ', ''));
      return invocation;
    }
    const props = Object.entries(newProps);
    const obj = {};
    Object.setPrototypeOf(
      obj,
      prototypesByPath[newProps._$protos[0]] ?? getObjectAtPath(newProps._$protos[0]),
    );
    for (const [prop, value] of props) {
      if (prop.startsWith('_$')) continue;
      let propName: string | symbol = prop;
      if (propName.startsWith('Symbol(')) {
        propName = Symbol.for(propName.match(/Symbol\((.+)\)/)[1]);
      }
      Object.defineProperty(obj, propName, buildDescriptor(value, `${path}.${prop}`));
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
    overriddenFns.set(attrs.get, entry._$get);
  } else if (entry['_$$value()']) {
    attrs.value = entry['_$$value()']();
  } else if (entry._$value !== undefined) {
    attrs.value = entry._$value;
  }

  if (entry._$set) {
    attrs.set = new Proxy(Function.prototype.call.bind({}), {
      apply() {},
    });
    overriddenFns.set(attrs.set, entry._$set);
  }

  let prototypeDescriptor: PropertyDescriptor;
  if (entry.prototype) {
    prototypeDescriptor = buildDescriptor(entry.prototype, `${path}.prototype`);

    if (!entry.prototype._$flags || !entry.prototype._$flags.includes('w')) {
      prototypeDescriptor.writable = false;
    }
    if (entry._$function) {
      overriddenFns.set(prototypeDescriptor.value.constructor, entry._$function);
    }
    prototypesByPath[`${path}.prototype`] = prototypeDescriptor.value;
  }

  // do after prototypes are created
  if (entry._$function) {
    const newProps = entry['new()'];
    if (newProps) {
      attrs.value = newObjectConstructor(newProps, path, entry._$invocation);
    } else {
      // use function call just to get a function that doesn't create prototypes on new
      // bind to an empty object so we don't modify the original
      attrs.value = new Proxy(Function.prototype.call.bind({}), {
        apply() {
          return entry._$invocation;
        },
      });
    }
    if (entry._$invocation !== undefined) {
      Object.setPrototypeOf(attrs.value, Function.prototype);
      delete attrs.value.prototype;
      delete attrs.value.constructor;
    }

    if (prototypeDescriptor && newProps) {
      Object.defineProperty(prototypeDescriptor.value, 'constructor', {
        value: attrs.value,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
    overriddenFns.set(attrs.value, entry._$function);
  }

  if (typeof entry === 'object') {
    const props = Object.entries(entry).filter(([prop]) => !prop.startsWith('_$'));
    if (!attrs.value && (props.length || entry._$protos)) {
      attrs.value = {};
    }
    if (entry._$protos) {
      const proto = prototypesByPath[entry._$protos[0]] ?? getObjectAtPath(entry._$protos[0]);
      attrs.value = Object.setPrototypeOf(attrs.value, proto);
    }

    for (const [prop, value] of props) {
      if (prop.startsWith('_$') || prop === 'new()') continue;
      if (prop === 'arguments' || prop === 'caller') continue;
      let propName: string | number | symbol = prop;
      if (propName.startsWith('Symbol(')) {
        propName = globalSymbols[propName];
        if (!propName) {
          const symbolName = (propName as string).match(/Symbol\((.+)\)/)[1];
          propName = Symbol.for(symbolName);
        }
      }
      let descriptor: PropertyDescriptor;
      if (propName === 'prototype') {
        descriptor = prototypeDescriptor;
      } else {
        descriptor = buildDescriptor(value, `${path}.${prop}`);
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
  let obj: any = self;
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
  _$protos?: string[];
  'new()'?: IDescriptor;
  prototype: IDescriptor;
}
