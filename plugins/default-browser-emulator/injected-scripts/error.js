"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, sourceUrl, utils: { ObjectCached, ReflectCached, toOriginalFn, replaceFunction }, }) {
    if (typeof self === 'undefined') {
        return;
    }
    const OriginalError = Error;
    const originalErrorProperties = ObjectCached.getOwnPropertyDescriptors(Error);
    Error.stackTraceLimit = 10000;
    Error.prepareStackTrace = prepareStackTrace;
    ObjectCached.defineProperty(self, 'Error', {
        value: function Error(msg, opts) {
            'use strict';
            const argArray = [msg, opts];
            if (!new.target) {
                return ReflectCached.apply(OriginalError, this, argArray);
            }
            return ReflectCached.construct(OriginalError, argArray, new.target);
        },
    });
    ObjectCached.defineProperties(Error, originalErrorProperties);
    Error.prototype.constructor = Error;
    toOriginalFn.set(Error, OriginalError);
    ObjectCached.getOwnPropertyNames(self).forEach(key => {
        if (!key.includes('Error'))
            return;
        const item = self[key];
        if (OriginalError.isPrototypeOf(item) && ObjectCached.getPrototypeOf(item) === OriginalError) {
            ObjectCached.setPrototypeOf(item, Error);
        }
    });
    function prepareStackAndStackTraces(error, stackTraces = []) {
        let stack = error.stack;
        const safeStackTraces = [];
        if (!stack)
            return { stack, stackTraces: safeStackTraces };
        const lines = stack.split('\n');
        const safeLines = [];
        if (lines.length <= 1)
            return { stack, stackTraces };
        safeLines.push(lines[0]);
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i];
            let stackTrace = stackTraces.at(i - 1);
            if (safeLines.length > Error.stackTraceLimit && args.applyStackTraceLimit)
                break;
            if (args.fixConsoleStack && line.includes(sourceUrl) && line.includes('console.')) {
                ({ line, stackTrace } = fixConsoleStack(line, stackTrace));
            }
            if (line.includes(sourceUrl) && args.removeInjectedLines)
                continue;
            safeLines.push(line);
            if (stackTrace)
                safeStackTraces.push(stackTrace);
        }
        stack = safeLines.join('\n');
        return { stack, stackTraces: safeStackTraces };
    }
    function fixConsoleStack(line, stackTrace) {
        line = `${line.substring(0, 20)}(<anonymous>)`;
        if (stackTrace) {
            const originalProperties = ObjectCached.getOwnPropertyDescriptors(ObjectCached.getPrototypeOf(stackTrace));
            const writeableProperties = ObjectCached.getOwnPropertyDescriptors(ObjectCached.getPrototypeOf(stackTrace));
            ObjectCached.keys(writeableProperties).forEach(key => {
                writeableProperties[key].writable = true;
                writeableProperties[key].configurable = true;
            });
            const newProto = {};
            ObjectCached.defineProperties(newProto, writeableProperties);
            ObjectCached.setPrototypeOf(stackTrace, newProto);
            [
                'getScriptNameOrSourceURL',
                'getLineNumber',
                'getEnclosingLineNumber',
                'getEnclosingColumnNumber',
                'getColumnNumber',
            ].forEach(key => replaceFunction(stackTrace, key, (target, thisArg, argArray) => {
                const _result = ReflectCached.apply(target, thisArg, argArray);
                return null;
            }));
            replaceFunction(stackTrace, 'getPosition', (target, thisArg, argArray) => {
                const _result = ReflectCached.apply(target, thisArg, argArray);
                return 0;
            });
            const ObjectCachedHere = ObjectCached;
            ObjectCached.keys(originalProperties).forEach(key => {
                ObjectCachedHere.defineProperty(newProto, key, {
                    ...ObjectCachedHere.getOwnPropertyDescriptor(newProto, key),
                    writable: originalProperties[key].writable,
                    configurable: originalProperties[key].configurable,
                });
            });
        }
        return { line, stackTrace };
    }
    function prepareStackTrace(error, stackTraces) {
        const { stack, stackTraces: safeStackTraces } = prepareStackAndStackTraces(error, stackTraces);
        const customPrepareStackTrace = Error.prepareStackTrace;
        if (!customPrepareStackTrace) {
            return stack;
        }
        if (typeof customPrepareStackTrace !== 'function') {
            return stack;
        }
        error.stack = stack;
        try {
            return customPrepareStackTrace(error, safeStackTraces);
        }
        catch {
            return error.toString();
        }
    }
}
