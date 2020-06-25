proxyFunction(WebGLRenderingContext.prototype, 'getParameter', function(
  originalFunction,
  thisArg,
  parameter,
) {
  // UNMASKED_VENDOR_WEBGL
  if (parameter === 37445) {
    return 'Intel Inc.';
  }
  // UNMASKED_RENDERER_WEBGL
  if (parameter === 37446) {
    return 'Intel Iris OpenGL Engine';
  }
  return originalFunction.call(thisArg, parameter);
});
