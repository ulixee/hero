"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emulatorDataDir = void 0;
const Path = require("path");
const Paths = require("./paths.json");
let PathsLocal;
try {
    // eslint-disable-next-line import/no-unresolved
    PathsLocal = require('./paths.local.json');
}
catch {
    PathsLocal = {};
}
const PathsMerged = {
    ...Paths,
    ...PathsLocal,
};
exports.emulatorDataDir = Path.resolve(__dirname, PathsMerged['emulator-data']);
//# sourceMappingURL=paths.js.map