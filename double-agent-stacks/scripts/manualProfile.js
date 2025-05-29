"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@ulixee/commons/lib/SourceMapSupport");
const AssignmentsClient_1 = require("@double-agent/runner/lib/AssignmentsClient");
const paths_1 = require("../paths");
async function manualProfile() {
    const userId = process.argv[2] ?? 'manual';
    const assignmentsClient = new AssignmentsClient_1.default(userId);
    const assignment = await assignmentsClient.createSingleUserAgentIdAssignment(undefined, (0, paths_1.getLocalDataPath)('/3-assignments'));
    console.log('You need to navigate to these urls (or use the links to click through):');
    for (const [pluginId, pages] of Object.entries(assignment.pagesByPlugin)) {
        console.log('\n------------- PLUGIN: %s------------', pluginId);
        console.log(pages.map(x => x.url).join('\n'));
    }
    console.log('\n\nFiles will download to: %s\n\n', (0, paths_1.getLocalDataPath)(`/3-assignments/individual/${userId}`));
}
manualProfile().catch(console.error);
//# sourceMappingURL=manualProfile.js.map