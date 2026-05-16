"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, callback, utils: { replaceSetter, ReflectCached }, }) {
    const cookieCallback = callback.bind(null, args.callbackName);
    replaceSetter(Document.prototype, 'cookie', (target, thisArg, argArray) => {
        const cookie = argArray.at(0);
        if (cookie) {
            cookieCallback(JSON.stringify({ cookie, origin: self.location.origin }));
        }
        return ReflectCached.apply(target, thisArg, argArray);
    });
}
