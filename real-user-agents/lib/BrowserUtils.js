"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrowserId = createBrowserId;
exports.createBrowserIdFromUserAgentString = createBrowserIdFromUserAgentString;
const extractUserAgentMeta_1 = require("./extractUserAgentMeta");
function createBrowserId(browser) {
    const name = browser.name.toLowerCase().replace(/\s/g, '-');
    const minorVersion = name === 'edge' ? '0' : browser.version.minor;
    return `${name}-${browser.version.major}-${minorVersion}`;
}
function createBrowserIdFromUserAgentString(userAgentString) {
    const { name, version } = (0, extractUserAgentMeta_1.default)(userAgentString);
    return createBrowserId({ name, version });
}
//# sourceMappingURL=BrowserUtils.js.map