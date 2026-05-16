"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootDir = exports.emulatorDataDir = void 0;
const Path = require("path");
const Paths = require("./paths.json");
exports.emulatorDataDir = Path.resolve(__dirname, Paths['emulator-data']);
exports.rootDir = Path.resolve(__dirname, Paths.root);
//# sourceMappingURL=paths.js.map