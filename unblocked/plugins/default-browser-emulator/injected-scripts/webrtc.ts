const maskLocalIp = args.localIp;
const replacementIp = args.proxyIp;

if ('RTCIceCandidate' in self && RTCIceCandidate.prototype) {
  proxyGetter(RTCIceCandidate.prototype, 'candidate', function () {
    const result = ReflectCached.apply(...arguments);
    return result.replace(maskLocalIp, replacementIp);
  });
  if ('address' in RTCIceCandidate.prototype) {
    // @ts-ignore
    proxyGetter(RTCIceCandidate.prototype, 'address', function () {
      const result: string = ReflectCached.apply(...arguments);
      return result.replace(maskLocalIp, replacementIp);
    });
  }
  proxyFunction(RTCIceCandidate.prototype, 'toJSON', function () {
    const json = ReflectCached.apply(...arguments);
    if ('address' in json) json.address = json.address.replace(maskLocalIp, replacementIp);
    if ('candidate' in json) json.candidate = json.candidate.replace(maskLocalIp, replacementIp);
    return json;
  });
}

if ('RTCSessionDescription' in self && RTCSessionDescription.prototype) {
  proxyGetter(RTCSessionDescription.prototype, 'sdp', function () {
    let result = ReflectCached.apply(...arguments);
    while (result.indexOf(maskLocalIp) !== -1) {
      result = result.replace(maskLocalIp, replacementIp);
    }
    return result;
  });
  proxyFunction(RTCSessionDescription.prototype, 'toJSON', function () {
    const json = ReflectCached.apply(...arguments);
    if ('sdp' in json) json.sdp = json.sdp.replace(maskLocalIp, replacementIp);
    return json;
  });
}
