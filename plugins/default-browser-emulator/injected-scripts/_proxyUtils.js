"use strict";
const ReflectCached = {
    construct: Reflect.construct.bind(Reflect),
    get: Reflect.get.bind(Reflect),
    set: Reflect.set.bind(Reflect),
    apply: Reflect.apply.bind(Reflect),
    setPrototypeOf: Reflect.setPrototypeOf.bind(Reflect),
    ownKeys: Reflect.ownKeys.bind(Reflect),
    getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor.bind(Reflect),
};
const ErrorCached = Error;
const ObjectCached = {
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
const toOriginalFn = new Map();
function internalModifyDescriptor(obj, key, newFunction, opts) {
    const descriptorInHierarch = getDescriptorInHierarchy(obj, key);
    if (!descriptorInHierarch)
        throw new Error('prototype descriptor not found');
    const { descriptor, descriptorOwner } = descriptorInHierarch;
    const target = descriptor[opts.descriptorKey];
    const newDescriptor = {
        ...descriptor,
        [opts.descriptorKey](...argArray) {
            if (opts.descriptorKey === 'value') {
                const expectedFnProto = ObjectCached.getPrototypeOf(target);
                let receivedFnProto = expectedFnProto;
                try {
                    receivedFnProto = ObjectCached.getPrototypeOf(this[key]);
                }
                catch { }
                if (expectedFnProto !== receivedFnProto) {
                    return ReflectCached.apply(this[key], this, argArray);
                }
            }
            if (opts?.onlyForInstance && this !== obj) {
                return ReflectCached.apply(target, this, argArray);
            }
            return newFunction(target, this, argArray);
        },
    };
    const originalValueDescriptors = ObjectCached.getOwnPropertyDescriptors(ObjectCached.getOwnPropertyDescriptor(descriptor, opts.descriptorKey).value);
    ObjectCached.defineProperties(newDescriptor[opts.descriptorKey], originalValueDescriptors);
    ObjectCached.defineProperty(descriptorOwner, key, newDescriptor);
    toOriginalFn.set(newDescriptor[opts.descriptorKey], target);
    return newDescriptor;
}
function replaceFunction(obj, key, newFunction, opts = {}) {
    return internalModifyDescriptor(obj, key, newFunction, { ...opts, descriptorKey: 'value' });
}
function replaceGetter(obj, key, newFunction, opts = {}) {
    return internalModifyDescriptor(obj, key, newFunction, { ...opts, descriptorKey: 'get' });
}
function replaceSetter(obj, key, newFunction, opts = {}) {
    return internalModifyDescriptor(obj, key, newFunction, { ...opts, descriptorKey: 'set' });
}
const hiddenKey = typeof sourceUrl === 'string' ? sourceUrl : 'testing';
const sharedStorage = { ready: false };
replaceFunction(Function.prototype, 'toString', (target, thisArg, argArray) => {
    if (argArray.at(0) === hiddenKey)
        return sharedStorage;
    const originalFn = toOriginalFn.get(thisArg);
    if (typeof originalFn === 'string')
        return originalFn;
    return ReflectCached.apply(target, originalFn ?? thisArg, argArray);
});
function getSharedStorage() {
    try {
        return Function.prototype.toString(sourceUrl);
    }
    catch {
        return undefined;
    }
}
if (getSharedStorage()?.ready) {
    return;
}
if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = {
        proxyFunction,
        replaceFunction,
    };
}
let nativeToStringFunctionString = `${Function.toString}`;
const overriddenFns = new Map();
const proxyToTarget = new WeakMap();
const proxyThisTracker = new Map([['External', undefined]]);
function getPrototypeSafe(obj) {
    try {
        return ObjectCached.getPrototypeOf(obj);
    }
    catch {
        return undefined;
    }
}
function runAndInjectProxyInStack(target, thisArg, argArray, proxy) {
    const name = overriddenFns.has(proxy) || overriddenFns.has(getPrototypeSafe(proxy))
        ? `Internal-${Math.random()}`
        : 'External';
    if (name.includes('Internal')) {
        if (typeof proxy === 'object' || typeof proxy === 'symbol') {
            proxyThisTracker.set(name, new WeakRef(proxy));
        }
        else {
            proxyThisTracker.set(name, proxy);
        }
    }
    const wrapper = {
        [name]() {
            return ReflectCached.apply(target, thisArg, argArray);
        },
    };
    return wrapper[name]();
}
(function trackProxyInstances() {
    if (typeof self === 'undefined')
        return;
    const descriptor = ObjectCached.getOwnPropertyDescriptor(self, 'Proxy');
    if (!descriptor)
        return;
    const OriginalProxy = Proxy;
    const originalProxyProperties = ObjectCached.getOwnPropertyDescriptors(Proxy);
    ObjectCached.defineProperty(self, 'Proxy', {
        value: function Proxy(target, handler) {
            'use strict';
            if (!new.target) {
                return ReflectCached.apply(OriginalProxy, this, [target, handler]);
            }
            const result = ReflectCached.construct(OriginalProxy, [target, handler], new.target);
            if (target && typeof target === 'object')
                proxyToTarget.set(result, target);
            return result;
        },
    });
    ObjectCached.defineProperties(Proxy, originalProxyProperties);
    Proxy.prototype.constructor = Proxy;
    toOriginalFn.set(Proxy, OriginalProxy);
})();
function proxyConstructor(owner, key, overrideFn) {
    const descriptor = ObjectCached.getOwnPropertyDescriptor(owner, key);
    if (!descriptor)
        throw new Error(`Descriptor with key ${String(key)} not found`);
    const toString = descriptor.value.toString();
    descriptor.value = new Proxy(descriptor.value, {
        construct(target, argArray, newTarget) {
            return overrideFn(target, argArray, newTarget);
        },
    });
    overriddenFns.set(descriptor.value, toString);
    ObjectCached.defineProperty(owner, key, descriptor);
}
const setProtoTracker = new WeakSet();
function internalCreateFnProxy(opts) {
    function apply(target, thisArg, argArray) {
        if (opts.inner?.apply) {
            return opts.inner.apply(target, thisArg, argArray);
        }
        return ReflectCached.apply(target, thisArg, argArray);
    }
    function setPrototypeOf(target, newPrototype) {
        let protoTarget = newPrototype;
        let newPrototypeProto;
        try {
            newPrototypeProto = ObjectCached.getPrototypeOf(newPrototype);
        }
        catch { }
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
        }
        catch (error) {
            setProtoTracker.add(error);
            throw error;
        }
    }
    function get(target, p, receiver) {
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
    function set(target, p, value, receiver) {
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
        const toString = overriddenFns.get(opts.target) ?? opts.target.toString();
        overriddenFns.set(proxy, toString);
        toOriginalFn.set(proxy, toString);
    }
    return proxy;
}
function proxyFunction(thisObject, functionName, overrideFn, opts) {
    const descriptorInHierarchy = getDescriptorInHierarchy(thisObject, functionName);
    if (!descriptorInHierarchy) {
        throw new Error(`Could not find descriptor for function: ${String(functionName)}`);
    }
    const { descriptorOwner, descriptor } = descriptorInHierarchy;
    descriptorOwner[functionName] = internalCreateFnProxy({
        target: descriptorOwner[functionName],
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
function proxyGetter(thisObject, propertyName, overrideFn, opts) {
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
function proxySetter(thisObject, propertyName, overrideFn, opts) {
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
function getDescriptorInHierarchy(obj, prop) {
    let proto = obj;
    do {
        if (!proto)
            return null;
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
function addDescriptorAfterProperty(path, prevProperty, propertyName, descriptor) {
    const owner = getObjectAtPath(path);
    if (!owner) {
        console.log(`ERROR: Parent for property descriptor not found: ${path} -> ${propertyName}`);
        return;
    }
    const descriptors = ObjectCached.getOwnPropertyDescriptors(owner);
    if (descriptors[propertyName]) {
        return;
    }
    const inHierarchy = getDescriptorInHierarchy(owner, propertyName);
    if (inHierarchy && descriptor.value) {
        if (inHierarchy.descriptor.get) {
            replaceGetter(owner, propertyName, () => descriptor.value, { onlyForInstance: true });
        }
        else {
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
            delete owner[key];
            ObjectCached.defineProperty(owner, key, existingDescriptor);
        }
        if (key === prevProperty) {
            ObjectCached.defineProperty(owner, propertyName, descriptor);
            hasPassedProperty = true;
        }
    }
}
const reordersByObject = new WeakMap();
replaceFunction(Object, 'getOwnPropertyDescriptors', (target, thisArg, argArray) => {
    const descriptors = ReflectCached.apply(target, thisArg, argArray);
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
    const keys = ReflectCached.apply(target, thisArg, argArray);
    const reorders = reordersByObject.get(thisArg) ?? reordersByObject.get(argArray.at(0));
    if (reorders) {
        for (const { propertyName, prevProperty, throughProperty } of reorders) {
            adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
        }
    }
    return keys;
});
replaceFunction(Object, 'keys', (target, thisArg, argArray) => {
    const keys = ReflectCached.apply(target, thisArg, argArray);
    const reorders = reordersByObject.get(thisArg) ?? reordersByObject.get(argArray.at(0));
    if (reorders) {
        for (const { propertyName, prevProperty, throughProperty } of reorders) {
            adjustKeyOrder(keys, propertyName, prevProperty, throughProperty);
        }
    }
    return keys;
});
function reorderNonConfigurableDescriptors(objectPath, propertyName, prevProperty, throughProperty) {
    const objectAtPath = getObjectAtPath(objectPath);
    if (!reordersByObject.has(objectAtPath))
        reordersByObject.set(objectAtPath, []);
    const reorders = reordersByObject.get(objectAtPath);
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
        console.log(`Can't redefine a non-existent prev property descriptor: ${path} -> ${propertyName}, prev =${prevProperty}`);
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
