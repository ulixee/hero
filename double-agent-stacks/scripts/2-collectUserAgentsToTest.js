"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const collectUserAgentsToTest_1 = require("@double-agent/runner/lib/collectUserAgentsToTest");
const Fs = require("fs");
const paths_1 = require("../paths");
const externalUserAgentsToTestDir = (0, paths_1.getExternalDataPath)('/2-user-agents-to-test/userAgentsToTest');
const externalUserAgentConfig = JSON.parse(Fs.readFileSync((0, paths_1.getExternalDataPath)('userAgentConfig.json'), 'utf8'));
(0, collectUserAgentsToTest_1.writeUserAgentsToTest)(externalUserAgentConfig, externalUserAgentsToTestDir).catch(console.error);
//# sourceMappingURL=2-collectUserAgentsToTest.js.map