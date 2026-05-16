"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { replaceFunction, ReflectCached, ObjectCached, replaceGetter }, }) {
    if ('speechSynthesis' in self) {
        const { voices } = args;
        replaceFunction(speechSynthesis, 'getVoices', (func, thisObj, ...argArray) => {
            const original = ReflectCached.apply(func, thisObj, argArray);
            if (!original.length)
                return original;
            const speechProto = ObjectCached.getPrototypeOf(original[0]);
            return voices.map(x => {
                const voice = ObjectCached.create(speechProto);
                replaceGetter(voice, 'name', () => x.name, { onlyForInstance: true });
                replaceGetter(voice, 'lang', () => x.lang, { onlyForInstance: true });
                replaceGetter(voice, 'default', () => x.default, { onlyForInstance: true });
                replaceGetter(voice, 'voiceURI', () => x.voiceURI, { onlyForInstance: true });
                replaceGetter(voice, 'localService', () => x.localService, { onlyForInstance: true });
                return voice;
            });
        });
    }
}
