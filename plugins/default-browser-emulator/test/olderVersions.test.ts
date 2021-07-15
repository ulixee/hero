import { Hero } from '@ulixee/hero-full-client';
import { Helpers } from '@ulixee/testing';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('it should match older userAgent strings', async () => {
  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.165 Safari/537.36';
  const hero = new Hero({ userAgent });
  Helpers.onClose(() => hero.close(), true);
  const meta = await hero.meta;

  expect(meta.userAgentString).toBe(userAgent);
});
