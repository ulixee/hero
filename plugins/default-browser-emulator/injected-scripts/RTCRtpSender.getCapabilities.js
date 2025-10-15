"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceFunction } }) {
    const { audioCodecs, videoCodecs } = args;
    if ('RTCRtpSender' in self && RTCRtpSender.prototype) {
        replaceFunction(RTCRtpSender, 'getCapabilities', function (target, thisArg, argArray) {
            const kind = argArray && argArray.length ? argArray[0] : null;
            const targetArgs = kind ? [kind] : undefined;
            const capabilities = target.apply(thisArg, targetArgs);
            if (kind === 'audio')
                capabilities.codecs = audioCodecs;
            if (kind === 'video')
                capabilities.codecs = videoCodecs;
            return capabilities;
        });
    }
}
