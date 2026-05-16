"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testIfNotOnGithubWindows = exports.testIfNotOnGithubMac = exports.env = exports.TestLogger = exports.BrowserUtils = exports.Helpers = void 0;
const Helpers = require("./helpers");
exports.Helpers = Helpers;
const BrowserUtils = require("./browserUtils");
exports.BrowserUtils = BrowserUtils;
const TestLogger_1 = require("./TestLogger");
exports.TestLogger = TestLogger_1.default;
const env_1 = require("./env");
exports.env = env_1.default;
exports.testIfNotOnGithubMac = process.env.CI === 'true' && process.platform === 'darwin' ? test.skip : test;
exports.testIfNotOnGithubWindows = process.env.CI === 'true' && process.platform === 'win32' ? test.skip : test;
//# sourceMappingURL=index.js.map