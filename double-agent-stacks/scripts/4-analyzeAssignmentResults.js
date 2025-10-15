"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const analyzeAssignmentResults_1 = require("@double-agent/runner/lib/analyzeAssignmentResults");
const Fs = require("fs");
const paths_1 = require("../paths");
const assignmentsDataDir = (0, paths_1.getExternalDataPath)(`/3-assignments`);
const resultsDir = (0, paths_1.getExternalDataPath)(`/4-assignment-results`);
if (Fs.existsSync(resultsDir))
    Fs.rmSync(resultsDir, { recursive: true });
(0, analyzeAssignmentResults_1.default)(assignmentsDataDir, resultsDir).catch(console.log);
//# sourceMappingURL=4-analyzeAssignmentResults.js.map