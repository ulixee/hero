"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepDiff_1 = require("@ulixee/unblocked-browser-profiler/lib/deepDiff");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function warnForNavigatorOsDifferences(browserNavigators, browserKey) {
    const navigators = browserNavigators[browserKey];
    const firstNavigator = navigators[0].navigator;
    for (const entry of navigators.slice(1)) {
        const navigatorDiff = (0, deepDiff_1.default)(firstNavigator, entry.navigator);
        if (navigatorDiff.added.length) {
            console.log('WARN: Browser navigator has added props for this OS', browserKey, entry.osKey, navigatorDiff.added);
        }
        if (navigatorDiff.removed.length) {
            console.log('WARN: Browser navigator has removed props for this OS', browserKey, entry.osKey, navigatorDiff.removed);
        }
    }
}
//# sourceMappingURL=navigatorOsDifferences.js.map