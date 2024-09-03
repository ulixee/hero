export type Args = {
  localIp: string;
  proxyIp: string;
};

const typedArgs = args as Args;

const maskLocalIp = typedArgs.localIp;
const replacementIp = typedArgs.proxyIp;

if ('RTCIceCandidate' in self && RTCIceCandidate.prototype) {
  // TODO argArray
  replaceGetter(RTCIceCandidate.prototype, 'candidate', (target, thisArg) => {
    const result = ReflectCached.apply(target, thisArg, []) as any;
    return result.replace(maskLocalIp, replacementIp);
  });
  if ('address' in RTCIceCandidate.prototype) {
    // @ts-ignore
    replaceGetter(RTCIceCandidate.prototype, 'address', (target, thisArg, argArray) => {
      const result: string = ReflectCached.apply(target, thisArg, argArray);
      return result.replace(maskLocalIp, replacementIp);
    });
  }
  replaceFunction(RTCIceCandidate.prototype, 'toJSON', (target, thisArg, argArray) => {
    const json = ReflectCached.apply(target, thisArg, argArray) as any;
    if ('address' in json) json.address = json.address.replace(maskLocalIp, replacementIp);
    if ('candidate' in json) json.candidate = json.candidate.replace(maskLocalIp, replacementIp);
    return json;
  });
}

if ('RTCSessionDescription' in self && RTCSessionDescription.prototype) {
  replaceGetter(RTCSessionDescription.prototype, 'sdp', (target, thisArg, argArray) => {
    let result = ReflectCached.apply(target, thisArg, argArray) as any;
    while (result.indexOf(maskLocalIp) !== -1) {
      result = result.replace(maskLocalIp, replacementIp);
    }
    return result;
  });
  replaceGetter(RTCSessionDescription.prototype, 'toJSON', (target, thisArg, argArray) => {
    const json = ReflectCached.apply(target, thisArg, argArray) as any;
    if ('sdp' in json) json.sdp = json.sdp.replace(maskLocalIp, replacementIp);
    return json;
  });
}
