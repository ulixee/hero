"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const importFoundationalProfiles_1 = require("@double-agent/runner/lib/importFoundationalProfiles");
const Fs = require("fs");
const paths_1 = require("../paths");
const profilesDir = (0, paths_1.getExternalDataPath)('0-foundational-profiles');
const externalUserAgentConfig = JSON.parse(Fs.readFileSync((0, paths_1.getExternalDataPath)('userAgentConfig.json'), 'utf8'));
(0, importFoundationalProfiles_1.default)(profilesDir, externalUserAgentConfig).catch(console.error);
//# sourceMappingURL=0-importFoundationalProfiles.js.map