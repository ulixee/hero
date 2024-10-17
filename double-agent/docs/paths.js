"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outputDir = void 0;
const Path = require("path");
const Paths = require("./paths.json");
exports.outputDir = Path.resolve(__dirname, Paths.output);
//# sourceMappingURL=paths.js.map