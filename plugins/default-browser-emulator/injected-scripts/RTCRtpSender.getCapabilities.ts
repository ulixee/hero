import type { ScriptInput } from './_utils';

export type Args = {
  audioCodecs: any;
  videoCodecs: any;
};
export function main({ args, utils: { replaceFunction } }: ScriptInput<Args>) {
  const { audioCodecs, videoCodecs } = args;

  if ('RTCRtpSender' in self && RTCRtpSender.prototype) {
    replaceFunction(RTCRtpSender, 'getCapabilities', function (target, thisArg, argArray) {
      const kind = argArray && argArray.length ? argArray[0] : null;
      // TODO should we use reflect here
      const targetArgs = kind ? [kind] : undefined;
      const capabilities = target.apply(thisArg, targetArgs);
      if (kind === 'audio') capabilities.codecs = audioCodecs;
      if (kind === 'video') capabilities.codecs = videoCodecs;
      return capabilities;
    });
  }
}
