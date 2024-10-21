"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unblocked_agent_testing_1 = require("@ulixee/unblocked-agent-testing");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const index_1 = require("../index");
let koaServer;
let pool;
const logger = unblocked_agent_testing_1.TestLogger.forTest(module);
beforeEach(unblocked_agent_testing_1.Helpers.beforeEach);
beforeAll(async () => {
    pool = new unblocked_agent_1.Pool({ plugins: [index_1.default] });
    await pool.start();
    unblocked_agent_testing_1.Helpers.onClose(() => pool.close(), true);
    koaServer = await unblocked_agent_testing_1.Helpers.runKoaServer();
});
afterAll(unblocked_agent_testing_1.Helpers.afterAll, 30e3);
afterEach(unblocked_agent_testing_1.Helpers.afterEach, 30e3);
(0, unblocked_agent_testing_1.testIfNotOnGithubWindows)('can use widevine', async () => {
    const agent = pool.createAgent({
        logger,
    });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(koaServer.baseUrl);
    const accessKey = await page
        .evaluate(`navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{
      initDataTypes: ['cenc'],
      audioCapabilities: [
        {
          contentType: 'audio/mp4;codecs="mp4a.40.2"',
        },
      ],
      videoCapabilities: [
        {
          contentType: 'video/mp4;codecs="avc1.42E01E"',
        },
      ],
    },
  ]).then(x => {
    if (x.keySystem !== 'com.widevine.alpha') throw new Error('Wrong keysystem ' + x.keySystem);
    return x.createMediaKeys();
  }).then(x => {
    return x.constructor.name
  }).catch((error) => 'error: ' + error.toString());`)
        .catch((err) => err);
    expect(accessKey).toBe('MediaKeys');
});
test('plays m3u8', async () => {
    const agent = pool.createAgent({
        logger,
    });
    unblocked_agent_testing_1.Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(koaServer.baseUrl);
    const isSupported = await page
        .evaluate(`MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')`)
        .catch((err) => err);
    expect(isSupported).toBe(true);
});
//# sourceMappingURL=media.test.js.map