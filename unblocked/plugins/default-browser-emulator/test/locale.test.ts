import Pool from '@unblocked-web/agent/lib/Pool';
import { Helpers, TestLogger } from '@unblocked-web/plugins-testing';
import { ITestKoaServer } from '@unblocked-web/plugins-testing/helpers';
import BrowserEmulator from '../index';

let koaServer: ITestKoaServer;
let pool: Pool;

const logger = TestLogger.forTest(module);

beforeEach(Helpers.beforeEach);
beforeAll(async () => {
  pool = new Pool({ plugins: [BrowserEmulator] });
  Helpers.onClose(() => pool.close(), true);
  await pool.start();
  koaServer = await Helpers.runKoaServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Locale and Timezone tests', () => {
  it('should be able to set a timezoneId', async () => {
    const agent = pool.createAgent({
      logger,
      options: {
        timezoneId: 'America/Los_Angeles',
      },
    });
    Helpers.needsClosing.push(agent);
    await new Promise((resolve) => setTimeout(resolve, 1e3));

    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);

    const formatted = 'Sat Nov 19 2016 10:12:34 GMT-0800 (Pacific Standard Time)';
    const timezoneOffset = await page.evaluate('new Date(1479579154987).toString()');
    expect(timezoneOffset).toBe(formatted);
  });

  it('should affect accept-language header', async () => {
    const agent = pool.createAgent({
      logger,
      options: { locale: 'en-GB,en' },
    });
    Helpers.needsClosing.push(agent);

    let acceptLanguage = '';
    koaServer.get('/headers', (ctx) => {
      acceptLanguage = ctx.get('accept-language');
      ctx.body = '<html></html>';
    });

    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}/headers`);
    expect(acceptLanguage).toBe('en-GB,en;q=0.9');
  });

  it('should affect navigator.language', async () => {
    const agent = pool.createAgent({
      logger,
      options: { locale: 'fr-CH,fr-CA' },
    });
    Helpers.needsClosing.push(agent);

    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);
    const result = await page.evaluate(`navigator.language`);
    expect(result).toBe('fr-CH');

    const result2 = await page.evaluate(`navigator.languages`);
    expect(result2).toStrictEqual(['fr-CH', 'fr-CA']);
  });

  it('should format number', async () => {
    {
      const agent = pool.createAgent({
        logger,
        options: { locale: 'en-US,en;q=0.9' },
      });
      Helpers.needsClosing.push(agent);

      const page = await agent.newPage();
      await page.goto(`${koaServer.baseUrl}`);
      const result = await page.evaluate(`(1000000.5).toLocaleString()`);
      expect(result).toBe('1,000,000.5');
    }
    {
      const agent = pool.createAgent({
        logger,
        options: { locale: 'fr-CH' },
      });
      Helpers.needsClosing.push(agent);

      const page = await agent.newPage();
      await page.goto(`${koaServer.baseUrl}`);

      const result = await page.evaluate(`(1000000.5).toLocaleString()`);
      expect(result).toBe('1 000 000,5');
    }
  });

  it('should format date', async () => {
    {
      const agent = pool.createAgent({
        options: {
          locale: 'en-US',
          timezoneId: 'America/Los_Angeles',
        },
      });
      Helpers.needsClosing.push(agent);

      const page = await agent.newPage();
      await page.goto(`${koaServer.baseUrl}`);

      const formatted = 'Sat Nov 19 2016 10:12:34 GMT-0800 (Pacific Standard Time)';

      const result = await page.evaluate(`new Date(1479579154987).toString()`);
      expect(result).toBe(formatted);
    }
    {
      const agent = pool.createAgent({
        logger,
        options: {
          locale: 'de-DE',
          timezoneId: 'Europe/Berlin',
        },
      });
      Helpers.needsClosing.push(agent);

      const page = await agent.newPage();
      await page.goto(`${koaServer.baseUrl}`);

      const formatted = 'Sat Nov 19 2016 19:12:34 GMT+0100 (Mitteleuropäische Normalzeit)';
      const result = await page.evaluate(`new Date(1479579154987).toString()`);
      expect(result).toBe(formatted);
    }
  });
});

describe('geolocation', () => {
  it('should be able to set a geolocation', async () => {
    const agent = pool.createAgent({
      logger,
      options: { geolocation: { longitude: 10, latitude: 10 } },
    });
    Helpers.needsClosing.push(agent);
    const page = await agent.newPage();
    await page.goto(koaServer.baseUrl);

    const geolocation =
      await page.evaluate(`new Promise(resolve => navigator.geolocation.getCurrentPosition(position => {
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      }))`);
    expect(geolocation).toEqual({
      latitude: 10,
      longitude: 10,
    });
  });
});
