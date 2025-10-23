"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = extractFoundationalProbes;
const ProbesGenerator_1 = require("@double-agent/config/lib/ProbesGenerator");
async function extractFoundationalProbes(profilesDir) {
    const probesGenerator = new ProbesGenerator_1.default(profilesDir);
    await probesGenerator.clearBuckets();
    await probesGenerator.run();
    await probesGenerator.save();
}
//# sourceMappingURL=extractFoundationalProbes.js.map