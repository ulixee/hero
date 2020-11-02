import { Helpers } from "@secret-agent/testing";
import { GlobalPool } from "@secret-agent/core";
import { ITestKoaServer } from "@secret-agent/testing/helpers";
import Viewport from "@secret-agent/emulators/lib/Viewport";
import SecretAgent from "../index";

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer(true);
  GlobalPool.maxActiveSessionCount = 3;
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Emulator tests', () => {
  it('should be able to set a timezoneId', async () => {
    const browser = await SecretAgent.createBrowser({
      timezoneId: 'America/Los_Angeles',
    });
    Helpers.needsClosing.push(browser);

    await browser.goto(`${koaServer.baseUrl}`);

    const formatted = 'Sat Nov 19 2016 10:12:34 GMT-0800 (Pacific Standard Time)';
    const timezoneOffset = await browser.getJsValue('new Date(1479579154987).toString()');
    expect(timezoneOffset.value).toBe(formatted);
  });

  it('should affect accept-language header', async () => {
    const browser = await SecretAgent.createBrowser({ locale: 'en-US,en;q=0.9' });
    Helpers.needsClosing.push(browser);

    let acceptLanguage = '';
    koaServer.get('/headers', ctx => {
      acceptLanguage = ctx.get('accept-language');
    });

    await browser.goto(`${koaServer.baseUrl}/headers`);
    expect(acceptLanguage).toBe('en-US,en;q=0.9');
  });

  it('should affect navigator.language', async () => {
    const browser = await SecretAgent.createBrowser({ locale: 'fr-CH,fr-CA' });
    Helpers.needsClosing.push(browser);

    await browser.goto(`${koaServer.baseUrl}`);
    const result = await browser.getJsValue(`navigator.language`);
    expect(result.value).toBe('fr-CH');

    const result2 = await browser.getJsValue(`navigator.languages`);
    expect(result2.value).toStrictEqual(['fr-CH', 'fr-CA']);
  });

  it('should format number', async () => {
    {
      const browser = await SecretAgent.createBrowser({ locale: 'en-US,en;q=0.9' });
      Helpers.needsClosing.push(browser);

      await browser.goto(`${koaServer.baseUrl}`);
      const result = await browser.getJsValue(`(1000000.5).toLocaleString()`);
      expect(result.value).toBe('1,000,000.5');
    }
    {
      const browser = await SecretAgent.createBrowser({ locale: 'fr-CH' });
      Helpers.needsClosing.push(browser);

      await browser.goto(`${koaServer.baseUrl}`);

      const result = await browser.getJsValue(`(1000000.5).toLocaleString()`);
      expect(result.value).toBe('1 000 000,5');
    }
  });

  it('should format date', async () => {
    {
      const browser = await SecretAgent.createBrowser({
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
      });
      Helpers.needsClosing.push(browser);

      await browser.goto(`${koaServer.baseUrl}`);

      const formatted = 'Sat Nov 19 2016 10:12:34 GMT-0800 (Pacific Standard Time)';

      const result = await browser.getJsValue(`new Date(1479579154987).toString()`);
      expect(result.value).toBe(formatted);
    }
    {
      const browser = await SecretAgent.createBrowser({
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      });
      Helpers.needsClosing.push(browser);

      await browser.goto(`${koaServer.baseUrl}`);

      const formatted = 'Sat Nov 19 2016 19:12:34 GMT+0100 (Mitteleuropäische Normalzeit)';
      const result = await browser.getJsValue(`new Date(1479579154987).toString()`);
      expect(result.value).toBe(formatted);
    }
  });
});

describe('setScreensize', () => {
  it('should set the proper viewport size', async () => {
    const viewport = Viewport.getRandom();
    const browser = await SecretAgent.createBrowser({
      viewport,
    });
    Helpers.needsClosing.push(browser);

    await browser.goto(`${koaServer.baseUrl}`);
    const screenWidth = await browser.getJsValue('screen.width');
    expect(screenWidth.value).toBe(viewport.screenWidth);
    const screenHeight = await browser.getJsValue('screen.height');
    expect(screenHeight.value).toBe(viewport.screenHeight);

    const screenX = await browser.getJsValue('screenX');
    expect(screenX.value).toBe(viewport.positionX);
    const screenY = await browser.getJsValue('screenY');
    expect(screenY.value).toBe(viewport.positionY);

    const innerWidth = await browser.getJsValue('innerWidth');
    expect(innerWidth.value).toBe(viewport.width);
    const innerHeight = await browser.getJsValue('innerHeight');
    expect(innerHeight.value).toBe(viewport.height);
  });

  it('should support Media Queries', async () => {
    const browser = await SecretAgent.createBrowser({
      viewport: {
        width: 200,
        height: 200,
        screenWidth: 200,
        screenHeight: 200,
        positionY: 0,
        positionX: 0,
      },
    });
    Helpers.needsClosing.push(browser);

    async function getQueryValue(mediaQuery: string) {
      const result = await browser.getJsValue(mediaQuery);
      return result.value;
    }

    expect(await getQueryValue(`matchMedia('(min-device-width: 100px)').matches`)).toBe(true);
    expect(await getQueryValue(`matchMedia('(min-device-width: 300px)').matches`)).toBe(false);
    expect(await getQueryValue(`matchMedia('(max-device-width: 100px)').matches`)).toBe(false);
    expect(await getQueryValue(`matchMedia('(max-device-width: 300px)').matches`)).toBe(true);
    expect(await getQueryValue(`matchMedia('(device-width: 500px)').matches`)).toBe(false);
    expect(await getQueryValue(`matchMedia('(device-width: 200px)').matches`)).toBe(true);

    expect(await getQueryValue(`matchMedia('(min-device-height: 100px)').matches`)).toBe(true);
    expect(await getQueryValue(`matchMedia('(min-device-height: 300px)').matches`)).toBe(false);
    expect(await getQueryValue(`matchMedia('(max-device-height: 100px)').matches`)).toBe(false);
    expect(await getQueryValue(`matchMedia('(max-device-height: 300px)').matches`)).toBe(true);
    expect(await getQueryValue(`matchMedia('(device-height: 500px)').matches`)).toBe(false);
    expect(await getQueryValue(`matchMedia('(device-height: 200px)').matches`)).toBe(true);
  });
});
