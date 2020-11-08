import InjectedScripts from '@secret-agent/emulate-browsers-base/injected-scripts';
import IPageOverride from '@secret-agent/core-interfaces/IPageOverride';
import { parseNavigatorPlugins } from '@secret-agent/emulate-browsers-base';
import codecs from './codecs.json';
import navigator from './navigator.json';

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
  const injectedScripts = new InjectedScripts();
  injectedScripts.add('errors');
  injectedScripts.add('navigator', {
    platform: args.platform,
    memory: args.memory,
    languages: args.languages,
    ensureOneVideoDevice: args.videoDevice,
  });
  // can't support this broad of changes
  // getOverrideScript('polyfill', polyfills),

  injectedScripts.add('plugins', parseNavigatorPlugins((navigator as any).navigator));
  injectedScripts.add('webGl');
  injectedScripts.add('console');
  if (args.windowFrame) {
    injectedScripts.add('screen', args.windowFrame);
  }
  const osString = `${args.osFamily} ${args.osVersion}`;
  let matchingCodec = codecs.find(x => x.opSyses.includes(osString));
  if (!matchingCodec) {
    // just match on os
    matchingCodec = codecs.find(x => x.opSyses.some(y => y.includes(args.osFamily)));
  }
  if (matchingCodec) {
    injectedScripts.add('codecs', {
      audioCodecs: matchingCodec.profile.audioSupport,
      videoCodecs: matchingCodec.profile.videoSupport,
    });
    injectedScripts.add('webRtc', {
      video: matchingCodec.profile.webRtcVideoCodecs,
      audio: matchingCodec.profile.webRtcAudioCodecs,
    });
  }

  injectedScripts.add('cookieInterceptor', {
    callbackName: args.cookieParams.callbackWindowName,
  });

  const overrides = injectedScripts.build();
  Object.assign(overrides[0], args.cookieParams);
  return overrides;
}
