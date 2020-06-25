import getOverrideScript from '../shared/page-scripts';
import IPageOverride from '@secret-agent/emulators/interfaces/IPageOverride';
import parseNavigatorPlugins from '../shared/parseNavigatorPlugins';
import { platform } from 'os';

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
    defaultPolyfills: any;
    windows7Polyfills: any;
    windows10Polyfills: any;
    navigator: any;
  },
) {
  const {
    codecs,
    chrome,
    defaultPolyfills,
    windows7Polyfills,
    windows10Polyfills,
    navigator,
  } = data;
  let polyfills: any = defaultPolyfills;
  if (args.osFamily === 'Windows') {
    if (args.osVersion === '10.0') {
      polyfills = windows10Polyfills;
    } else {
      polyfills = windows7Polyfills;
    }
  }

  const scripts: IPageOverride[] = [
    getOverrideScript('navigator', {
      platform: args.platform,
      memory: args.memory,
      languages: args.languages,
      ensureOneVideoDevice: args.videoDevice,
    }),
    getOverrideScript('chrome', {
      updateLoadTimes: true,
      polyfill: {
        property: chrome.chrome,
        prevProperty: chrome.prevProperty,
      },
    }),
  ];

  // polyfills only work on linux!! meant to be deployed with docker
  if (platform() === 'linux') {
    scripts.push(getOverrideScript('polyfill', polyfills));
  }

  scripts.push(
    getOverrideScript('plugins', parseNavigatorPlugins((navigator as any).navigator)),
    getOverrideScript('webGl'),
    getOverrideScript('console'),
    getOverrideScript('iframe'),
  );
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
  return scripts;
}
