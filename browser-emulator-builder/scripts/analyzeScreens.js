// import IDomProfile from '@double-agent/collect-browser-dom/interfaces/IDomProfile';
// import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
//
//   const profiles = BrowserProfiler.getProfiles<IDomProfile>('browser-dom');
//
//   for (const profile of profiles) {
//     const {browserId, osId} = BrowserProfiler.extractMetaFromUserAgentId(profile.userAgentId);
//     const window = profile.data.window;
//
//     const screen: any = {};
//     for (const key of Object.keys(window.screen)) {
//       screen[key] = window.screen[key]._$value;
//     }
//
//     const screenX = window.screenX._$value;
//     const screenY = window.screenY._$value;
//
//     const screenWidth = window.screen.width._$value;
//     const screenHeight = window.screen.height._$value;
//
//     const browserWidth = window.innerWidth._$value;
//     const browserHeight = window.innerHeight._$value;
//
//     // console.log(osId.padEnd(20), browserId.padEnd(20), `${screenWidth}x${screenHeight}`.padEnd(15), `${browserWidth}x${browserHeight}`.padEnd(15));
//     console.log(osId.padEnd(20), browserId.padEnd(20), `${screenWidth}x${screenHeight}`.padEnd(15), `${screenX}x${screenY}`.padEnd(15), `${browserWidth}x${browserHeight}`.padEnd(15), JSON.stringify(screen));
//   }
//# sourceMappingURL=analyzeScreens.js.map