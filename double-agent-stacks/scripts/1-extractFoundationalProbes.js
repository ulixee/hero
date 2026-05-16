"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const extractFoundationalProbes_1 = require("@double-agent/runner/lib/extractFoundationalProbes");
const paths_1 = require("../paths");
const foundationalProfilesDir = (0, paths_1.getExternalDataPath)('/0-foundational-profiles');
(0, extractFoundationalProbes_1.default)(foundationalProfilesDir).catch(console.log);
//# sourceMappingURL=1-extractFoundationalProbes.js.map