const { supportedCodecs } = args;

if ((window as any).MediaRecorder) {
  proxyFunction((window as any).MediaRecorder, 'isTypeSupported', (func, thisArg, type) => {
    if (type === undefined) return ProxyOverride.callOriginal;
    return supportedCodecs.includes(type);
  });
}
