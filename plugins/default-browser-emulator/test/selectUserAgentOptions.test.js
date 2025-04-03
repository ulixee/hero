"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const selectUserAgentOption_1 = require("../lib/helpers/selectUserAgentOption");
const DataLoader_1 = require("../lib/DataLoader");
const index_1 = require("../index");
const UserAgentOptions_1 = require("../lib/UserAgentOptions");
const BrowserEngineOptions_1 = require("../lib/BrowserEngineOptions");
const dataLoader = new DataLoader_1.default();
const browserEngineOptions = new BrowserEngineOptions_1.default(dataLoader, process.env.ULX_DEFAULT_BROWSER_ID ?? process.env.ULX_DEFAULT_BROWSER_ID);
const userAgentOptions = new UserAgentOptions_1.default(dataLoader, browserEngineOptions);
test('should support choosing a specific useragent', async () => {
    const options = (0, selectUserAgentOption_1.default)(`~ chrome >= ${index_1.defaultBrowserEngine.version.major} && chrome < ${Number(index_1.defaultBrowserEngine.version.major) + 1}`, userAgentOptions);
    expect(options.browserVersion.major).toBe(index_1.defaultBrowserEngine.version.major);
});
test('should support choosing a specific OS', async () => {
    const options = (0, selectUserAgentOption_1.default)('~ mac & chrome >= 88', userAgentOptions);
    expect(parseInt(options.browserVersion.major, 10)).toBeGreaterThanOrEqual(88);
    expect(options.operatingSystemCleanName).toBe('mac-os');
});
test('it should find correct browser meta', async () => {
    const browserMeta = index_1.default.selectBrowserMeta(`Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${index_1.defaultBrowserEngine.version.major}.0.4324.182 Safari/537.36`);
    const data = dataLoader.as(browserMeta.userAgentOption);
    const asOsId = data.osDataDir.split('/').pop();
    expect(asOsId).toEqual('as-mac-os-11');
});
test('should throw an error for a non-installed pattern', async () => {
    try {
        expect((0, selectUserAgentOption_1.default)('~ mac & chrome >= 500000', userAgentOptions)).not.toBeTruthy();
    }
    catch (err) {
        expect(err.message).toMatch('No installed UserAgent');
    }
});
//# sourceMappingURL=selectUserAgentOptions.test.js.map