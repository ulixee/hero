proxyFunction(WebGLRenderingContext.prototype, 'getParameter', function(
  originalFunction,
  thisArg,
  argArray,
) {
  const parameter = argArray && argArray.length ? argArray[0] : null;
  if (args[parameter]) {
    return args[parameter];
  }
  return originalFunction.call(thisArg, argArray);
});
