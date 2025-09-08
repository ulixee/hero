"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootDir = exports.probesDataDir = void 0;
const Path = require("path");
const Paths = require("./paths.json");
exports.probesDataDir = Path.resolve(__dirname, Paths['probe-data']);
exports.rootDir = Path.resolve(__dirname, Paths.root);
//# sourceMappingURL=paths.js.map