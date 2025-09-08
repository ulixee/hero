"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { ReflectCached, replaceFunction } }) {
    const activatedDebugInfo = new WeakSet();
    const ReflectCachedHere = ReflectCached;
    for (const context of [
        self.WebGLRenderingContext.prototype,
        self.WebGL2RenderingContext.prototype,
    ]) {
        replaceFunction(context, 'getExtension', function (target, thisArg, argArray) {
            const result = ReflectCachedHere.apply(target, thisArg, argArray);
            if (argArray.at(0) === 'WEBGL_debug_renderer_info') {
                activatedDebugInfo.add(thisArg);
            }
            return result;
        });
        replaceFunction(context, 'getParameter', function (target, thisArg, argArray) {
            const parameter = argArray && argArray.length ? argArray[0] : null;
            const result = ReflectCached.apply(target, thisArg, argArray);
            if (args[parameter]) {
                if (!result && !activatedDebugInfo.has(context)) {
                    return result;
                }
                return args[parameter];
            }
            return result;
        });
    }
}
