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
      attrs.value = newObjectConstructor(newProps, path, entry._$invocation, entry._$isAsync);
    } else {
      Object.keys(entry)
        .filter((key): key is OtherInvocationKey => key.startsWith('_$otherInvocation'))
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
    const { parent, property } = getParentAndProperty(path);
    return parent[property];
  }
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

  static addOtherInvocation(
    basePath: string,
    otherKey: OtherInvocationKey,
    otherInvocation: any,
  ) {
    const [invocationKey, ...otherParts] = otherKey.split('.');
    const otherPath = otherParts.join('.');
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
  ): { invocation: any; path: string; isAsync: boolean } {
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
