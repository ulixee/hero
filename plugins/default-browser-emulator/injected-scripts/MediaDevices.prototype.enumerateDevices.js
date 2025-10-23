"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceFunction, ReflectCached } }) {
    if (navigator.mediaDevices &&
        navigator.mediaDevices.enumerateDevices &&
        navigator.mediaDevices.enumerateDevices.name !== 'bound reportBlock') {
        const videoDevice = {
            deviceId: args.deviceId,
            groupId: args.groupId,
            kind: 'videoinput',
            label: '',
        };
        replaceFunction(MediaDevices.prototype, 'enumerateDevices', (target, thisArg, argArray) => {
            return ReflectCached.apply(target, thisArg, argArray).then(list => {
                if (list.find(x => x.kind === 'videoinput'))
                    return list;
                list.push(videoDevice);
                return list;
            });
        });
    }
}
