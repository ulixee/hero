export type Args = Record<string, string | number | boolean>;
const typedArgs = args as Args;

const activatedDebugInfo = new WeakSet<WebGL2RenderingContext | WebGLRenderingContext>();

const ReflectCachedHere = ReflectCached;
for (const context of [
  self.WebGLRenderingContext.prototype,
  self.WebGL2RenderingContext.prototype,
]) {
  replaceFunction(context, 'getExtension', function (target, thisArg, argArray) {
    const result = ReflectCachedHere.apply(target, thisArg, argArray) as any;
    if (argArray.at(0) === 'WEBGL_debug_renderer_info') {
      activatedDebugInfo.add(thisArg);
    }

    return result;
  });

  // eslint-disable-next-line @typescript-eslint/no-loop-func
  replaceFunction(context, 'getParameter', function (target, thisArg, argArray) {
    const parameter = argArray && argArray.length ? argArray[0] : null;
    // call api to make sure signature goes through
    const result = ReflectCached.apply(target, thisArg, argArray);
    if (typedArgs[parameter]) {
      if (!result && !activatedDebugInfo.has(context)) {
        return result;
      }

      return typedArgs[parameter];
    }
    return result;
  });
}
