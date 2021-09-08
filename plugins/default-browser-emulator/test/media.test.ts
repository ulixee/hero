import { Helpers } from '@ulixee/hero-testing';
import { ITestKoaServer } from '@ulixee/hero-testing/helpers';
import Hero from '@ulixee/hero';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll, 30e3);
afterEach(Helpers.afterEach, 30e3);

test('can use widevine', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(koaServer.baseUrl);

  const accessKey = await hero
    .getJsValue(
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
    .catch(err => err);
  expect(accessKey).toBe('MediaKeys');
});

test('plays m3u8', async () => {
  const hero = new Hero();
  Helpers.needsClosing.push(hero);
  await hero.goto(koaServer.baseUrl);

  const isSupported = await hero
    .getJsValue(`MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')`)
    .catch(err => err);
  expect(isSupported).toBe(true);
});
