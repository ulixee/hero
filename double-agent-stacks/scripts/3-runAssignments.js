"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const commander_1 = require("commander");
const process_1 = require("process");
const AssignmentRunner_1 = require("@double-agent/runner/lib/AssignmentRunner");
const UnblockedRunnerFactory_1 = require("../lib/UnblockedRunnerFactory");
const PuppeteerRunnerFactory_1 = require("../lib/PuppeteerRunnerFactory");
const paths_1 = require("../paths");
// RunnerId groups together all supported runner implementations.
var RunnerId;
(function (RunnerId) {
    RunnerId["Puppeteer"] = "puppeteer";
    RunnerId["Unblocked"] = "unblocked";
})(RunnerId || (RunnerId = {}));
function parseRunnerID(value, previous) {
    switch (value.toLowerCase().trim()) {
        case 'unblocked':
        case 'ubk': {
            return RunnerId.Unblocked;
        }
        case 'puppeteer':
        case 'pptr': {
            return RunnerId.Puppeteer;
        }
        default: {
            console.warn(`parseRunnerID: ignore unrecognized runner value: '${value}'`);
            return previous;
        }
    }
}
commander_1.program.option('-r, --runner <unblocked|ubk|pptr|puppeteer>', 'select the runner to run', parseRunnerID, RunnerId.Unblocked);
commander_1.program.parse();
const options = commander_1.program.opts();
const userAgentsToTestPath = (0, paths_1.getExternalDataPath)(`/2-user-agents-to-test/userAgentsToTest.json`);
const dataDir = (0, paths_1.getExternalDataPath)(`/3-assignments`);
const runnerId = options.runner || RunnerId.Puppeteer;
let runnerFactory;
switch (runnerId) {
    case RunnerId.Puppeteer: {
        runnerFactory = new PuppeteerRunnerFactory_1.default();
        break;
    }
    case RunnerId.Unblocked: {
        runnerFactory = new UnblockedRunnerFactory_1.default();
        break;
    }
    default:
        console.error(`ignoring runner with id ${runnerId}: unsupported`);
        (0, process_1.exit)(1);
}
new AssignmentRunner_1.default(runnerFactory, userAgentsToTestPath, dataDir)
    .run()
    .catch(console.log);
//# sourceMappingURL=3-runAssignments.js.map