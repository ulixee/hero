import { Helpers, TestLogger } from '@ulixee/unblocked-plugins-testing';
import { ITestKoaServer } from '@ulixee/unblocked-plugins-testing/helpers';
import { Pool } from '@ulixee/unblocked-agent';
import BrowserEmulator from '../index';

let koaServer: ITestKoaServer;
let pool: Pool;
const logger = TestLogger.forTest(module);

beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  pool = new Pool({ plugins: [BrowserEmulator] });
  await pool.start();
  Helpers.onClose(() => pool.close(), true);
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll, 30e3);
afterEach(Helpers.afterEach, 30e3);

test('can use widevine', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(koaServer.baseUrl);

  const accessKey = await page
    .evaluate(
      `navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{
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
  })`,
    )
    .catch((err) => err);
  expect(accessKey).toBe('MediaKeys');
});

test('plays m3u8', async () => {
  const agent = pool.createAgent({
    logger,
  });
  Helpers.needsClosing.push(agent);
  const page = await agent.newPage();
  await page.goto(koaServer.baseUrl);

  const isSupported = await page
    .evaluate(`MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')`)
    .catch((err) => err);
  expect(isSupported).toBe(true);
});
