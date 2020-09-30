import InjectedScripts from '../injected-scripts';
import parseNavigatorPlugins from './parseNavigatorPlugins';

export default function pageOverrides(
  args: {
    osFamily: string;
    osVersion: string;
    platform: string;
    memory: number;
    languages: string[];
    videoDevice: { groupId: string; deviceId: string };
    windowFrame?: number;
  },
  data: {
    codecs: any;
    chrome: any;
    polyfills: any;
    navigator: any;
  },
) {
  const { codecs, chrome, polyfills, navigator } = data;

  const injectedScripts = new InjectedScripts();
  injectedScripts.add('errors');
  injectedScripts.add('navigator', {
    platform: args.platform,
    memory: args.memory,
    languages: args.languages,
    ensureOneVideoDevice: args.videoDevice,
  });
  injectedScripts.add('chrome', {
    updateLoadTimes: true,
    polyfill: {
      property: chrome.chrome,
      prevProperty: chrome.prevProperty,
    },
  });

  if (polyfills) {
    injectedScripts.add('polyfill', polyfills);
  }

  injectedScripts.add('plugins', parseNavigatorPlugins(navigator.navigator));
  injectedScripts.add('webGl');
  injectedScripts.add('console');
  injectedScripts.add('iframe');

  if (args.windowFrame) {
    injectedScripts.add('screen', {
      windowFrame: args.windowFrame,
    });
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
  return injectedScripts.build();
}
