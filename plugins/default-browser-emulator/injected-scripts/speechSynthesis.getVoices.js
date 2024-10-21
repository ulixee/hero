"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedArgs = args;
if ('speechSynthesis' in self) {
    const { voices } = typedArgs;
    replaceFunction(speechSynthesis, 'getVoices', (func, thisObj, ...args) => {
        const original = ReflectCached.apply(func, thisObj, args);
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
