"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = assert;
exports.toUrl = toUrl;
exports.isPortInUse = isPortInUse;
exports.isPortInUseOnHost = isPortInUseOnHost;
exports.escapeUnescapedChar = escapeUnescapedChar;
exports.pickRandom = pickRandom;
exports.getObjectFunctionProperties = getObjectFunctionProperties;
exports.bindFunctions = bindFunctions;
exports.createPromise = createPromise;
const net = require("net");
const node_events_1 = require("node:events");
const Resolvable_1 = require("./Resolvable");
const eventUtils_1 = require("./eventUtils");
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
const prototypeFunctionMap = new Map();
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
            descriptor.writable &&
            !isClass(descriptor.value)) {
            functionKeys.add(key);
        }
    }
    prototypeFunctionMap.set(object, functionKeys);
    return functionKeys;
}
const stoppingPoints = new Set([
    node_events_1.EventEmitter.prototype,
    Object.prototype,
    Object,
    Function.prototype,
    eventUtils_1.TypedEventEmitter,
]);
function bindFunctions(self) {
    let proto = Object.getPrototypeOf(self);
    const keys = new Set();
    while (proto && !stoppingPoints.has(proto)) {
        for (const key of getObjectFunctionProperties(proto)) {
            // ensure the last class to define the function is the one that gets bound
            if (keys.has(key))
                continue;
            keys.add(key);
            self[key] = self[key].bind(self);
        }
        proto = Object.getPrototypeOf(proto);
    }
}
function createPromise(timeoutMillis, timeoutMessage) {
    return new Resolvable_1.default(timeoutMillis, timeoutMessage);
}
//# sourceMappingURL=utils.js.map