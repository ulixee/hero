proxyFunction(
  self.WebGLRenderingContext.prototype,
  'getParameter',
  function (originalFunction, thisArg, argArray) {
    const parameter = argArray && argArray.length ? argArray[0] : null;
    // call api to make sure signature goes through
    const result = Reflect.apply(originalFunction, thisArg, argArray);
    if (args[parameter]) {
      return args[parameter];
    }
    return result;
  },
);

proxyFunction(
  self.WebGL2RenderingContext.prototype,
  'getParameter',
  function (originalFunction, thisArg, argArray) {
    const parameter = argArray && argArray.length ? argArray[0] : null;
    // call api to make sure signature goes through
    const result = Reflect.apply(originalFunction, thisArg, argArray);
    if (args[parameter]) {
      return args[parameter];
    }
    return result;
  },
);
