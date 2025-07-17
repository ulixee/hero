"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceFunction, replaceGetter, ReflectCached }, }) {
    const maskLocalIp = args.localIp;
    const replacementIp = args.proxyIp;
    if ('RTCIceCandidate' in self && RTCIceCandidate.prototype) {
        replaceGetter(RTCIceCandidate.prototype, 'candidate', (target, thisArg) => {
            const result = ReflectCached.apply(target, thisArg, []);
            return result.replace(maskLocalIp, replacementIp);
        });
        if ('address' in RTCIceCandidate.prototype) {
            replaceGetter(RTCIceCandidate.prototype, 'address', (target, thisArg, argArray) => {
                const result = ReflectCached.apply(target, thisArg, argArray);
                return result.replace(maskLocalIp, replacementIp);
            });
        }
        replaceFunction(RTCIceCandidate.prototype, 'toJSON', (target, thisArg, argArray) => {
            const json = ReflectCached.apply(target, thisArg, argArray);
            if ('address' in json)
                json.address = json.address.replace(maskLocalIp, replacementIp);
            if ('candidate' in json)
                json.candidate = json.candidate.replace(maskLocalIp, replacementIp);
            return json;
        });
    }
    if ('RTCSessionDescription' in self && RTCSessionDescription.prototype) {
        replaceGetter(RTCSessionDescription.prototype, 'sdp', (target, thisArg, argArray) => {
            let result = ReflectCached.apply(target, thisArg, argArray);
            while (result.indexOf(maskLocalIp) !== -1) {
                result = result.replace(maskLocalIp, replacementIp);
            }
            return result;
        });
        replaceFunction(RTCSessionDescription.prototype, 'toJSON', (target, thisArg, argArray) => {
            const json = ReflectCached.apply(target, thisArg, argArray);
            if ('sdp' in json)
                json.sdp = json.sdp.replace(maskLocalIp, replacementIp);
            return json;
        });
    }
}
