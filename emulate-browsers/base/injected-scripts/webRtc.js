const { audio, video } = args;

proxyFunction(RTCRtpSender, 'getCapabilities', function(target, thisArg, kind) {
  const args = kind ? [kind] : undefined;
  const capabilities = target.apply(thisArg, args);
  if (kind === 'audio') capabilities.codecs = audio;
  if (kind === 'video') capabilities.codecs = video;
  return capabilities;
});
