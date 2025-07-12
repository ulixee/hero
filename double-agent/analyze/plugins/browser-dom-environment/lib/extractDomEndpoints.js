"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaValues = exports.unknownMetaKeys = exports.metaKeys = void 0;
exports.default = extractDomEndpoints;
exports.metaKeys = new Set([
    '_$protos',
    '_$function',
    '_$functionMethods',
    '_$flags',
    '_$accessException',
    '_$constructorException',
    '_$ref',
    '_$get',
    '_$set',
    '_$getToStringToString',
    '_$setToStringToString',
    '_$type',
    '_$value',
    '_$invocation',
    '_$skipped',
    '_$isFrozen',
    '_$isSealed',
    '_$keyOrder',
]);
exports.unknownMetaKeys = new Set();
exports.metaValues = {};
function extractDomEndpoints(dom) {
    const objectsToExtract = [{ path: [], object: dom }];
    const endpoints = [];
    // let invocationCount = 0;
    while (objectsToExtract.length) {
        const objectToExtract = objectsToExtract.pop();
        for (const key of Object.keys(objectToExtract.object)) {
            if (exports.metaKeys.has(key)) {
                continue;
            }
            const object = convertRefs(objectToExtract.object[key]);
            // if (object._$invocation !== undefined) {
            //   invocationCount += 1;
            //   console.log(invocationCount, 'invocations', object._$invocation ? 'EXISTS' : object._$invocation)
            // }
            const path = [...objectToExtract.path, key];
            const objectMeta = extractObjectMeta(path, object);
            if (['object', 'class', 'function', 'prototype', 'constructor'].includes(objectMeta._$type)) {
                if (Object.values(objectMeta).length) {
                    endpoints.push({ path: path.join('.'), object: objectMeta });
                }
                else {
                    endpoints.push({ path: path.join('.'), object: { _$type: 'object' } });
                }
                objectsToExtract.push({ path, object });
            }
            else if (objectMeta._$type === 'array') {
                endpoints.push({ path: path.join('.'), object: objectMeta });
                objectsToExtract.push({ path, object });
            }
            else {
                endpoints.push({ path: path.join('.'), object: objectMeta });
            }
        }
    }
    const endpointsByPath = {};
    for (const endpoint of endpoints.sort((a, b) => String(a.path).localeCompare(b.path))) {
        endpointsByPath[endpoint.path] = endpoint;
    }
    return endpointsByPath;
}
function extractObjectMeta(path, object) {
    if (object === null || object === undefined)
        return {};
    const objectMeta = {};
    const objectMetaKeys = [];
    const currentKey = path[path.length - 1];
    if (typeof object !== 'object') {
        return {
            _$type: 'raw',
            _$value: object,
        };
    }
    const nonMetaKeys = Object.keys(object).filter(x => !x.startsWith('_$'));
    if (nonMetaKeys.length) {
        object._$keyOrder = nonMetaKeys;
    }
    // domScript doesn't quite organize the dom correctly.
    if ((!object._$type || object._$type === 'object') &&
        (currentKey === 'prototype' || currentKey.endsWith('.prototype')) &&
        object._$protos) {
        object._$type = 'prototype';
    }
    else if (!object._$type && path.join('.') === 'window.Object.prototype') {
        object._$type = 'prototype';
    }
    else if (object._$type === 'function' && path.join('.') === 'window.Function.prototype') {
        object._$type = 'prototype';
    }
    else if (object._$type === 'function' || object._$function) {
        object._$type = 'function';
        if (object['new()']) {
            object._$type = 'class';
        }
        object._$functionMethods = {};
        for (const key of Object.keys(object).filter(x => ['name', 'length'].includes(x))) {
            // looping over Object.keys to retain order
            object._$functionMethods[key] = object[key];
            delete object[key];
        }
    }
    else if (!object._$type && object._$constructorException) {
        object._$type = 'constructor';
    }
    else if (!object._$type && object._$ref) {
        object._$type = 'ref';
    }
    else if (!object._$type && path.length === 1 && path[0] === 'window') {
        object._$type = 'object';
    }
    else if (!object._$type && typeof object === 'object') {
        object._$type = 'object';
    }
    else if (!object._$type && object._$set && !object._$get) {
        object._$type = 'setter';
    }
    else if (!object._$type) {
        object._$type = 'unknown';
    }
    if (currentKey === 'prototype' &&
        object._$type !== 'prototype' &&
        !object._$ref &&
        !object._$accessException) {
        console.log('========================');
        console.log('SHOULD BE PROTOTYPE!!!!!!', path.join('.'), object._$type || 'UNKNOWN');
        console.log(object);
    }
    for (const key of Object.keys(object)) {
        if (exports.metaKeys.has(key)) {
            objectMetaKeys.push(key);
        }
        else if (key.startsWith('_$')) {
            exports.unknownMetaKeys.add(key);
        }
    }
    for (const key of objectMetaKeys.sort()) {
        objectMeta[key] = object[key];
    }
    return objectMeta;
}
function convertRefs(object) {
    if (typeof object !== 'string')
        return object;
    if (object.startsWith('REF: ')) {
        return {
            _$type: 'ref',
            _$ref: object.replace('REF: ', ''),
        };
    }
    return object;
}
//# sourceMappingURL=extractDomEndpoints.js.map