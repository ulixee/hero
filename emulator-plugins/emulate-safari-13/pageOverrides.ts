import getOverrideScript from '@secret-agent/emulator-plugins-shared/injected-scripts';
import codecs from './codecs.json';
import navigator from './navigator.json';
import IPageOverride from '@secret-agent/emulators/interfaces/IPageOverride';
import parseNavigatorPlugins from '@secret-agent/emulator-plugins-shared/parseNavigatorPlugins';

export default function pageOverrides(args: {
  osFamily: string;
  osVersion: string;
  platform: string;
  memory: number;
  cookieParams: Pick<IPageOverride, 'callback' | 'callbackWindowName'>;
  languages: string[];
  videoDevice: { groupId: string; deviceId: string };
  windowFrame?: number;
}) {
  const scripts: IPageOverride[] = [
    getOverrideScript('navigator', {
      platform: args.platform,
      memory: args.memory,
      languages: args.languages,
      ensureOneVideoDevice: args.videoDevice,
    }),
    // can't support this broad of changes
    // getOverrideScript('polyfill', polyfills),
    getOverrideScript('plugins', parseNavigatorPlugins((navigator as any).navigator)),
    getOverrideScript('webGl'),
    getOverrideScript('console'),
  ];
  if (args.windowFrame) {
    scripts.push(
      getOverrideScript('screen', {
        windowFrame: args.windowFrame,
      }),
    );
  }
  const osString = `${args.osFamily} ${args.osVersion}`;
  let matchingCodec = codecs.find(x => x.opSyses.includes(osString));
  if (!matchingCodec) {
    // just match on os
    matchingCodec = codecs.find(x => x.opSyses.some(y => y.includes(args.osFamily)));
  }
  if (matchingCodec) {
    scripts.push(
      getOverrideScript('codecs', {
        audioCodecs: matchingCodec.profile.audioSupport,
        videoCodecs: matchingCodec.profile.videoSupport,
      }),
    );
    scripts.push(
      getOverrideScript('webRtc', {
        video: matchingCodec.profile.webRtcVideoCodecs,
        audio: matchingCodec.profile.webRtcAudioCodecs,
      }),
    );
  }

  scripts.push({
    ...getOverrideScript('cookieInterceptor', {
      callbackName: args.cookieParams.callbackWindowName,
    }),
    ...args.cookieParams,
  });

  return scripts;
}
