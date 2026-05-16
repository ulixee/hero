"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updatePathPatterns;
require("@ulixee/commons/lib/SourceMapSupport");
const Fs = require("fs");
const Path = require("path");
const index_1 = require("../index");
function updatePathPatterns() {
    const profilerPatternsDir = Path.join(index_1.default.profilesDataDir, 'dom-bridges/path-patterns');
    if (!Fs.existsSync(profilerPatternsDir))
        return;
    const localPathPatternsDir = Path.join(index_1.default.dataDir, 'path-patterns');
    if (!Fs.existsSync(localPathPatternsDir))
        Fs.mkdirSync(localPathPatternsDir, { recursive: true });
    for (const fileName of Fs.readdirSync(profilerPatternsDir)) {
        const fromFilePath = Path.join(profilerPatternsDir, fileName);
        const toFilePath = Path.join(localPathPatternsDir, fileName);
        const data = Fs.readFileSync(fromFilePath, 'utf8');
        Fs.writeFileSync(toFilePath, data);
    }
}
//# sourceMappingURL=updatePathPatterns.js.map