"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const Fs = require("fs");
const paths_1 = require("../paths");
const currentBrowserId = default_browser_emulator_1.defaultBrowserEngine.id;
const prevBrowserId = `${default_browser_emulator_1.defaultBrowserEngine.name}-${default_browser_emulator_1.defaultBrowserEngine.majorVersion - 1}-0`;
const agents = {
    browserIds: [currentBrowserId, prevBrowserId],
};
Fs.writeFileSync((0, paths_1.getExternalDataPath)('userAgentConfig.json'), JSON.stringify(agents, null, 2));
//# sourceMappingURL=syncLatestAgentIds.js.map