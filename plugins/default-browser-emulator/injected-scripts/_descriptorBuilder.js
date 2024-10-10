"use strict";
const nativeErrorRegex = new RegExp(/^(\w+):\s/);
const globalSymbols = {};
for (const symbol of ReflectCached.ownKeys(Symbol)) {
    if (typeof Symbol[symbol] === 'symbol') {
        globalSymbols[`${String(Symbol[symbol])}`] = Symbol[symbol];
    }
}
function createError(message, type) {
    if (!type) {
        const match = nativeErrorRegex.exec(message);
        if (match?.length) {
            message = message.replace(`${match[1]}: `, '');
            try {
                type = self[match[1]];
            }
            catch (err) {
            }
        }
    }
    if (!type)
        type = Error;
    const errType = new type(message);
    return errType;
}
function newObjectConstructor(newProps, path, invocation, isAsync) {
    return function () {
        if (newProps._$constructorException) {
            throw createError(newProps._$constructorException);
        }
        if (!new.target &&
            invocation &&
            !newProps['_$$value()'] &&
            !ObjectCached.values(newProps).some(x => x['_$$value()'])) {
            if (typeof invocation === 'function')
                return invocation(...arguments);
            return invocationReturnOrThrow(invocation, isAsync);
        }
        const props = ObjectCached.entries(newProps);
        const obj = {};
        if (!newProps._$protos)
            throw new Error('newProps._$protos undefined');
        ObjectCached.setPrototypeOf(obj, prototypesByPath[newProps._$protos[0]] ?? getObjectAtPath(newProps._$protos[0]));
        for (const [prop, value] of props) {
            if (prop.startsWith('_$'))
                continue;
            let propName = prop;
            if (propName.startsWith('Symbol(')) {
                propName = Symbol.for(propName.match(/Symbol\((.+)\)/)[1]);
            }
            ObjectCached.defineProperty(obj, propName, buildDescriptor(value, `${path}.${prop}`));
        }
        return obj;
    };
}
const prototypesByPath = {};
function buildDescriptor(entry, path) {
    const attrs = {};
    const flags = entry._$flags || '';
    if (flags.includes('c'))
        attrs.configurable = true;
    if (flags.includes('w'))
        attrs.writable = true;
    if (flags.includes('e'))
        attrs.enumerable = true;
    if (entry._$get) {
        attrs.get = new Proxy(Function.prototype.call.bind({}), {
            apply() {
                if (entry._$accessException)
                    throw createError(entry._$accessException);
                if (entry._$value)
                    return entry._$value;
                if (entry['_$$value()'])
                    return entry['_$$value()']();
            },
        });
        overriddenFns.set(attrs.get, entry._$get);
        toOriginalFn.set(attrs.get, entry._$get);
    }
    else if (entry['_$$value()']) {
        attrs.value = entry['_$$value()']();
    }
    else if (entry._$value !== undefined) {
        attrs.value = entry._$value;
    }
    if (entry._$set) {
        attrs.set = new Proxy(Function.prototype.call.bind({}), {
            apply() { },
        });
        overriddenFns.set(attrs.set, entry._$set);
        toOriginalFn.set(attrs.set, entry._$set);
    }
    let prototypeDescriptor;
    if (entry.prototype) {
        prototypeDescriptor = buildDescriptor(entry.prototype, `${path}.prototype`);
        if (!entry.prototype._$flags || !entry.prototype._$flags.includes('w')) {
            prototypeDescriptor.writable = false;
        }
        if (entry._$function) {
            overriddenFns.set(prototypeDescriptor.value.constructor, entry._$function);
            toOriginalFn.set(attrs.set, entry._$set);
        }
        prototypesByPath[`${path}.prototype`] = prototypeDescriptor.value;
    }
    if (entry._$function) {
        const newProps = entry['new()'];
        if (newProps) {
            attrs.value = newObjectConstructor(newProps, path, entry._$invocation, entry._$isAsync);
        }
        else {
            ObjectCached.keys(entry)
                .filter((key) => key.startsWith('_$otherInvocation'))
                .filter(key => !key.includes('new()'))
                .forEach(key => OtherInvocationsTracker.addOtherInvocation(path, key, entry[key]));
            attrs.value = new Proxy(Function.prototype.call.bind({}), {
                apply(_target, thisArg) {
                    const invocation = OtherInvocationsTracker.getOtherInvocation(path, thisArg)?.invocation ??
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
            if (prop.startsWith('_$') || prop === 'new()')
                continue;
            if (prop === 'arguments' || prop === 'caller')
                continue;
            let propName = prop;
            if (propName.startsWith('Symbol(')) {
                propName = globalSymbols[propName];
                if (!propName) {
                    const symbolName = propName.match(/Symbol\((.+)\)/)[1];
                    propName = Symbol.for(symbolName);
                }
            }
            let descriptor;
            if (propName === 'prototype') {
                descriptor = prototypeDescriptor;
            }
            else {
                descriptor = buildDescriptor(value, `${path}.${prop}`);
            }
            ObjectCached.defineProperty(attrs.value, propName, descriptor);
        }
    }
    return attrs;
}
function getParentAndProperty(path) {
    const parts = breakdownPath(path, 1);
    if (!parts)
        return undefined;
    return { parent: parts.parent, property: parts.remainder[0] };
}
function breakdownPath(path, propsToLeave) {
    if (!path || path.startsWith('detached')) {
        return undefined;
    }
    const parts = path.split(/\.Symbol\(([\w.]+)\)|\.(\w+)/).filter(Boolean);
    let obj = self;
    while (parts.length > propsToLeave) {
        let next = parts.shift();
        if (next === undefined)
            throw new Error('Reached end of parts without finding obj');
        if (next === 'window')
            continue;
        if (next?.startsWith('Symbol.'))
            next = Symbol.for(next);
        obj = obj[next];
        if (!obj) {
            throw new Error(`Property not found -> ${path} at ${String(next)}`);
        }
    }
    return { parent: obj, remainder: parts };
}
function getObjectAtPath(path) {
    const parts = breakdownPath(path, 0);
    if (!parts)
        return undefined;
    return parts.parent;
}
function invocationToMaybeError(invocation) {
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
function invocationReturnOrThrow(invocation, isAsync) {
    const error = invocationToMaybeError(invocation);
    if (isAsync && error)
        return Promise.reject(error);
    if (isAsync)
        return Promise.resolve(invocation);
    if (error)
        throw error;
    return invocation;
}
class PathToInstanceTracker {
    static addPath(path) {
        this.pathsToTrack.add(path);
    }
    static getPath(instance) {
        return this.instanceToPath.get(instance);
    }
    static updateAllReferences() {
        this.instanceToPath.clear();
        for (const path of this.pathsToTrack) {
            this.instanceToPath.set(this.getInstanceForPath(path), path);
        }
    }
    static getInstanceForPath(path) {
        const result = getParentAndProperty(path);
        if (!result)
            throw new Error('no parent and property found');
        const { parent, property } = result;
        return parent[property];
    }
}
PathToInstanceTracker.pathsToTrack = new Set();
PathToInstanceTracker.instanceToPath = new Map();
class OtherInvocationsTracker {
    static addOtherInvocation(basePath, otherKey, otherInvocation) {
        const [invocationKey, ...otherParts] = otherKey.split('.');
        const otherPath = otherParts.slice(0, -1).join('.');
        PathToInstanceTracker.addPath(otherPath);
        this.basePaths.add(basePath);
        this.otherInvocations.set(this.key(basePath, otherPath), {
            invocation: otherInvocation,
            isAsync: invocationKey.includes('Async'),
        });
    }
    static getOtherInvocation(basePath, otherThis) {
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
    static key(basePath, otherPath) {
        return `${basePath}....${otherPath}`;
    }
}
OtherInvocationsTracker.basePaths = new Set();
OtherInvocationsTracker.otherInvocations = new Map();
