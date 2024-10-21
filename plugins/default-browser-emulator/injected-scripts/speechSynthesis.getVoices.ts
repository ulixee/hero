import type { ScriptInput } from './_utils';

export type Args = {
  voices: any;
};

export function main({
  args,
  utils: { replaceFunction, ReflectCached, ObjectCached, replaceGetter },
}: ScriptInput<Args>) {
  if ('speechSynthesis' in self) {
    // @ts-ignore
    const { voices } = args;
    replaceFunction(speechSynthesis, 'getVoices', (func, thisObj, ...argArray) => {
      const original = ReflectCached.apply(func, thisObj, argArray) as any;
      if (!original.length) return original;
      const speechProto = ObjectCached.getPrototypeOf(original[0]);
      return voices.map(x => {
        const voice: SpeechSynthesisVoice = ObjectCached.create(speechProto);
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
