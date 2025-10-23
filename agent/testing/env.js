"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const Os = require("os");
exports.default = {
    dataDir: process.env.ULX_NETWORK_DIR ?? process.env.ULX_DATA_DIR ?? Path.join(Os.tmpdir(), '.ulixee'),
    isLogDebug: !!process.env.DEBUG?.match(/[,]?ulx[:,]?/),
    useLogColors: !JSON.parse(process.env.NODE_DISABLE_COLORS ?? '0'),
};
//# sourceMappingURL=env.js.map