"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localDataDir = exports.externalDataDir = exports.dataDir = void 0;
exports.getExternalDataPath = getExternalDataPath;
exports.getLocalDataPath = getLocalDataPath;
const Path = require("path");
const Paths = require("./paths.json");
exports.dataDir = Path.resolve(__dirname, Paths.data);
exports.externalDataDir = Path.join(exports.dataDir, 'external');
exports.localDataDir = Path.join(exports.dataDir, 'local');
function getExternalDataPath(path) {
    return Path.join(exports.externalDataDir, path);
}
function getLocalDataPath(path) {
    return Path.join(exports.localDataDir, path);
}
//# sourceMappingURL=paths.js.map