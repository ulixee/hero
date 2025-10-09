"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = extractUserAgentMeta;
const ua_parser_js_1 = require("ua-parser-js");
function extractUserAgentMeta(userAgentString) {
    const uaParser = new ua_parser_js_1.UAParser(userAgentString);
    const uaBrowser = uaParser.getBrowser();
    const uaOs = uaParser.getOS();
    const name = uaBrowser.name || 'unknown';
    const versions = uaBrowser.version?.split('.') || [];
    const version = {
        major: versions[0] || '0',
        minor: versions[1] || '0',
        build: versions[2],
        patch: versions[3],
    };
    const osName = uaOs.name || 'unknown';
    const osVersions = uaOs.version?.split('.') || [];
    const osVersion = {
        major: osVersions[0] || '0',
        minor: osVersions[1] || '0',
        build: osVersions[2] ?? '0',
    };
    return { name, version, osName, osVersion };
}
//# sourceMappingURL=extractUserAgentMeta.js.map