"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataDir = void 0;
exports.getDataFilePath = getDataFilePath;
const Path = require("path");
const Paths = require('../paths.json');
let PathsLocal;
try {
    // eslint-disable-next-line import/no-unresolved
    PathsLocal = require('../paths.local.json');
}
catch {
    PathsLocal = {};
}
const PathsMerged = {
    ...Paths,
    ...PathsLocal,
};
exports.dataDir = Path.resolve(__dirname, '..', PathsMerged.data);
function getDataFilePath(path) {
    return Path.join(exports.dataDir, path);
}
//# sourceMappingURL=paths.js.map