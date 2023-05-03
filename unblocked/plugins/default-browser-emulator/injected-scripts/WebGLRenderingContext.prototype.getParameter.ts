const activatedDebugInfo = new WeakSet<WebGL2RenderingContext | WebGLRenderingContext>();

for (const context of [
  self.WebGLRenderingContext.prototype,
  self.WebGL2RenderingContext.prototype,
]) {
  proxyFunction(context, 'getExtension', function (originalFunction, thisArg, argArray) {
    const result = Reflect.apply(originalFunction, thisArg, argArray);
    if (argArray?.[0] === 'WEBGL_debug_renderer_info') {
      activatedDebugInfo.add(thisArg);
    }

    return result;
  });

  // eslint-disable-next-line @typescript-eslint/no-loop-func
  proxyFunction(context, 'getParameter', function (originalFunction, thisArg, argArray) {
    const parameter = argArray && argArray.length ? argArray[0] : null;
    // call api to make sure signature goes through
    const result = Reflect.apply(originalFunction, thisArg, argArray);
    if (args[parameter]) {
      if (!result && !activatedDebugInfo.has(context)) {
        return result;
      }

      return args[parameter];
    }
    return result;
  });
}
