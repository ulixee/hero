if ('speechSynthesis' in self) {
  // @ts-ignore
  const { voices } = args;
  proxyFunction(speechSynthesis, 'getVoices', (func, thisObj, ...args) => {
    const original = ReflectCached.apply(func, thisObj, args);
    if (!original.length) return original;
    const speechProto = ObjectCached.getPrototypeOf(original[0]);
    return voices.map(x => {
      const voice: SpeechSynthesisVoice = Object.create(speechProto);
      proxyGetter(voice, 'name', () => x.name, true);
      proxyGetter(voice, 'lang', () => x.lang, true);
      proxyGetter(voice, 'default', () => x.default, true);
      proxyGetter(voice, 'voiceURI', () => x.voiceURI, true);
      proxyGetter(voice, 'localService', () => x.localService, true);
      return voice;
    });
  });
}
