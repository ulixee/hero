"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const unblocked_browser_profiler_1 = require("@ulixee/unblocked-browser-profiler");
const stableChromeVersions = require("@ulixee/real-user-agents/data/stableChromeVersions.json");
const Fs = require("fs");
const Path = require("path");
const Config_1 = require("../lib/json-creators/Config");
const Clienthello_1 = require("../lib/json-creators/Clienthello");
const Codecs_1 = require("../lib/json-creators/Codecs");
const DomPolyfill_1 = require("../lib/json-creators/DomPolyfill");
const Headers_1 = require("../lib/json-creators/Headers");
const WindowChrome_1 = require("../lib/json-creators/WindowChrome");
const WindowFraming_1 = require("../lib/json-creators/WindowFraming");
const WindowNavigator_1 = require("../lib/json-creators/WindowNavigator");
const Http2Session_1 = require("../lib/json-creators/Http2Session");
const UserAgentHints_1 = require("../lib/json-creators/UserAgentHints");
const EmulatorData_1 = require("../lib/EmulatorData");
const paths_1 = require("../paths");
const SpeechSynthesis_1 = require("../lib/json-creators/SpeechSynthesis");
const Fonts_1 = require("../lib/json-creators/Fonts");
const userAgentIdsByBrowserId = {};
for (const userAgentId of unblocked_browser_profiler_1.default.userAgentIds) {
    const { browserId } = unblocked_browser_profiler_1.default.extractMetaFromUserAgentId(userAgentId);
    userAgentIdsByBrowserId[browserId] = userAgentIdsByBrowserId[browserId] || [];
    userAgentIdsByBrowserId[browserId].push(userAgentId);
}
const forceRedoDom = process.argv[2] === 'force';
async function generate() {
    const chromeEngines = stableChromeVersions.filter(x => x.majorVersion >= 115);
    for (const browserId of Object.keys(userAgentIdsByBrowserId).sort((a, b) => Number(a.split('-').slice(1).join('.')) - Number(b.split('-').slice(1).join('.')))) {
        if (!browserId.startsWith('chrome') && !browserId.startsWith('safari'))
            continue;
        if (process.env.BROWSER_ID && !browserId.includes(process.env.BROWSER_ID))
            continue;
        const browserEngineId = EmulatorData_1.default.extractBrowserEngineId(browserId);
        const browserEngineOption = chromeEngines.find(x => x.id === browserEngineId);
        const browserDir = EmulatorData_1.default.getEmulatorDir(browserId);
        const userAgentIds = userAgentIdsByBrowserId[browserId];
        if (!browserEngineOption) {
            DomPolyfill_1.default.clean(browserDir, userAgentIds);
        }
        console.log('--------------------------------------------------');
        console.log(`GENERATING ${browserId}`);
        const config = new Config_1.default(browserId, browserEngineId, browserEngineOption);
        console.log('- Clienthello');
        new Clienthello_1.default(config, userAgentIds).save(browserDir);
        console.log('- Headers');
        new Headers_1.default(config, userAgentIds).save(browserDir);
        console.log('- Http2');
        new Http2Session_1.default(config, userAgentIds).save(browserDir);
        console.log('- UserAgentHints');
        new UserAgentHints_1.default(config, userAgentIds).save(browserDir);
        if (config.browserEngineOption) {
            console.log('- Codecs');
            new Codecs_1.default(config, userAgentIds).save(browserDir);
            console.log('- Speech');
            new SpeechSynthesis_1.default(config, userAgentIds).save(browserDir);
            console.log('- Fonts');
            new Fonts_1.default(config, userAgentIds).save(browserDir);
            console.log('- WindowChrome');
            new WindowChrome_1.default(config, userAgentIds).save(browserDir);
            console.log('- WindowFraming');
            new WindowFraming_1.default(config, userAgentIds).save(browserDir);
            console.log('- WindowNavigator');
            new WindowNavigator_1.default(config, userAgentIds).save(browserDir);
            const hasAllPolyfills = DomPolyfill_1.default.hasAllDomPolyfills(browserId, browserDir, userAgentIds);
            if (!hasAllPolyfills || forceRedoDom) {
                new DomPolyfill_1.default(config, userAgentIds).save(browserDir);
            }
        }
        config.save(browserDir);
    }
    await Fs.promises.writeFile(Path.resolve(paths_1.emulatorDataDir, `browserEngineOptions.json`), JSON.stringify(chromeEngines, null, 2));
}
generate().catch(console.error);
//# sourceMappingURL=generateEmulatorData.js.map