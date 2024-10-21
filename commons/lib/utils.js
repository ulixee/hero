"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = assert;
exports.toUrl = toUrl;
exports.isPortInUse = isPortInUse;
exports.isPortInUseOnHost = isPortInUseOnHost;
exports.escapeUnescapedChar = escapeUnescapedChar;
exports.pickRandom = pickRandom;
exports.getObjectFunctionProperties = getObjectFunctionProperties;
exports.getPrototypeHierarchy = getPrototypeHierarchy;
exports.bindFunctions = bindFunctions;
exports.createPromise = createPromise;
const net = require("net");
const Resolvable_1 = require("./Resolvable");
function assert(value, message, reject) {
    if (value)
        return;
    const error = new Error(message);
    if (reject) {
        reject(error);
    }
    else {
        throw error;
    }
}
function toUrl(hostOrUrlFragment, defaultProtocol = 'ws:') {
    if (!hostOrUrlFragment)
        return null;
    defaultProtocol = defaultProtocol.replaceAll('/', '');
    if (!hostOrUrlFragment.includes('://')) {
        hostOrUrlFragment = `${defaultProtocol}//${hostOrUrlFragment}`;
    }
    return new URL(hostOrUrlFragment);
}
async function isPortInUse(port) {
    if (await isPortInUseOnHost(port, 'localhost'))
        return true;
    return await isPortInUseOnHost(port, '::');
}
function isPortInUseOnHost(port, host = 'localhost') {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', err => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // Port is in use
            }
            else {
                reject(err);
            }
            cleanup();
        });
        server.once('listening', () => {
            resolve(false);
            cleanup();
        });
        const cleanup = () => {
            server.removeAllListeners();
            server.unref();
            server.close();
        };
        server.listen(Number(port), host);
    });
}
function escapeUnescapedChar(str, char) {
    let i = str.indexOf(char);
    while (i !== -1) {
        if (str[i - 1] !== '\\') {
            str = `${str.substr(0, i)}\\${str.substr(i)}`;
        }
        i = str.indexOf(char, i + 2);
    }
    return str;
}
function isClass(func) {
    // Class constructor is also a function
    if (!(func && func.constructor === Function) || func.prototype === undefined)
        return false;
    // This is a class that extends other class
    if (Function.prototype !== Object.getPrototypeOf(func))
        return true;
    // Usually a function will only have 'constructor' in the prototype
    return Object.getOwnPropertyNames(func.prototype).length > 1;
}
function pickRandom(array) {
    if (array.length === 1)
        return array[0];
    if (!array.length)
        throw new Error('Empty array provided to "pickRandom"');
    return array[Math.floor(Math.random() * array.length)];
}
const prototypeFunctionMap = new WeakMap();
function getObjectFunctionProperties(object) {
    if (prototypeFunctionMap.has(object))
        return prototypeFunctionMap.get(object);
    const functionKeys = new Set();
    for (const key of Reflect.ownKeys(object)) {
        if (key === 'constructor') {
            continue;
        }
        const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
        if (descriptor &&
            typeof descriptor.value === 'function' &&
            !descriptor.get &&
            !descriptor.set &&
            descriptor.writable &&
            !Object.prototype[key] &&
            !Object[key] &&
            !isClass(descriptor.value)) {
            functionKeys.add(key);
        }
    }
    prototypeFunctionMap.set(object, functionKeys);
    return functionKeys;
}
const prototypeHierarchyCache = new WeakMap();
function getPrototypeHierarchy(self) {
    const hierarchy = [];
    let object = self;
    do {
        hierarchy.unshift(object);
        if (prototypeHierarchyCache.has(object)) {
            return prototypeHierarchyCache.get(object).concat(hierarchy);
        }
        object = Reflect.getPrototypeOf(object);
    } while (object && object !== Object.prototype);
    // don't put in the last item
    for (let i = 0; i < hierarchy.length - 1; i += 1) {
        const entry = hierarchy[i];
        const ancestors = i > 0 ? hierarchy.slice(0, i) : [];
        prototypeHierarchyCache.set(entry, ancestors);
    }
    return hierarchy;
}
function bindFunctions(self) {
    const hierarchy = getPrototypeHierarchy(self);
    for (const tier of hierarchy) {
        const keys = getObjectFunctionProperties(tier);
        for (const key of keys) {
            self[key] = self[key].bind(self);
        }
    }
}
function createPromise(timeoutMillis, timeoutMessage) {
    return new Resolvable_1.default(timeoutMillis, timeoutMessage);
}
//# sourceMappingURL=utils.js.map