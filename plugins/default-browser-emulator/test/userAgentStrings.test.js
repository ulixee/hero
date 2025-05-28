"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const index_1 = require("../index");
afterAll(unblocked_agent_testing_1.Helpers.afterAll);
afterEach(unblocked_agent_testing_1.Helpers.afterEach);
test('it should run uninstalled userAgent strings on the closest installed browser', async () => {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';
    const browserMeta = index_1.default.selectBrowserMeta(userAgent);
    const userAgentOption = browserMeta.userAgentOption;
    expect(userAgentOption.string).toBe(userAgent);
    expect(userAgentOption.browserVersion.major).toBe(index_1.defaultBrowserEngine.version.major);
    expect(browserMeta.browserEngine.fullVersion.split('.')[0]).toBe(index_1.defaultBrowserEngine.majorVersion.toString());
});
test('it should run pick an OS match for the default chrome on mac', async () => {
    const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${index_1.defaultBrowserEngine.version.major}.0.3987.165 Safari/537.36`;
    const browserMeta = index_1.default.selectBrowserMeta(userAgent);
    const userAgentOption = browserMeta.userAgentOption;
    expect(userAgentOption.string).toBe(userAgent);
    expect(browserMeta.browserEngine.fullVersion.split('.')[0]).toBe(index_1.defaultBrowserEngine.majorVersion.toString());
    expect(userAgentOption.browserVersion.major).toBe(index_1.defaultBrowserEngine.version.major);
    const osVersion = userAgentOption.operatingSystemVersion;
    expect(Number(osVersion.major)).toBeGreaterThanOrEqual(10);
    if (Number(osVersion.major) === 10) {
        expect(Number(osVersion.minor)).toBeGreaterThan(15);
    }
    expect(browserMeta.userAgentOption.operatingSystemCleanName).toBe('mac-os');
});
//# sourceMappingURL=userAgentStrings.test.js.map