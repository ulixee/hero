import { Helpers } from '@secret-agent/testing';
import { GlobalPool } from '@secret-agent/core';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import Viewport from '@secret-agent/emulate-browsers-base/lib/Viewport';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
let handler: Handler;
beforeAll(async () => {
  handler = new Handler();
  Helpers.onClose(() => handler.close(), true);
  koaServer = await Helpers.runKoaServer(true);
  GlobalPool.maxConcurrentAgentsCount = 3;
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Emulator tests', () => {
  it('should be able to set a timezoneId', async () => {
    const agent = await handler.createAgent({
      timezoneId: 'America/Los_Angeles',
    });
    Helpers.needsClosing.push(agent);

    await agent.goto(`${koaServer.baseUrl}`);

    const formatted = 'Sat Nov 19 2016 10:12:34 GMT-0800 (Pacific Standard Time)';
    const timezoneOffset = await agent.getJsValue('new Date(1479579154987).toString()');
    expect(timezoneOffset.value).toBe(formatted);
  });

  it('should affect accept-language header', async () => {
    const agent = await handler.createAgent({ locale: 'en-US,en;q=0.9' });
    Helpers.needsClosing.push(agent);

    let acceptLanguage = '';
    koaServer.get('/headers', ctx => {
      acceptLanguage = ctx.get('accept-language');
      ctx.body = '<html></html>';
    });

    await agent.goto(`${koaServer.baseUrl}/headers`);
    expect(acceptLanguage).toBe('en-US,en;q=0.9');
  });

  it('should affect navigator.language', async () => {
    const agent = await handler.createAgent({ locale: 'fr-CH,fr-CA' });
    Helpers.needsClosing.push(agent);

    await agent.goto(`${koaServer.baseUrl}`);
    const result = await agent.getJsValue(`navigator.language`);
    expect(result.value).toBe('fr-CH');

    const result2 = await agent.getJsValue(`navigator.languages`);
    expect(result2.value).toStrictEqual(['fr-CH', 'fr-CA']);
  });

  it('should format number', async () => {
    {
      const agent = await handler.createAgent({ locale: 'en-US,en;q=0.9' });
      Helpers.needsClosing.push(agent);

      await agent.goto(`${koaServer.baseUrl}`);
      const result = await agent.getJsValue(`(1000000.5).toLocaleString()`);
      expect(result.value).toBe('1,000,000.5');
    }
    {
      const agent = await handler.createAgent({ locale: 'fr-CH' });
      Helpers.needsClosing.push(agent);

      await agent.goto(`${koaServer.baseUrl}`);

      const result = await agent.getJsValue(`(1000000.5).toLocaleString()`);
      expect(result.value).toBe('1 000 000,5');
    }
  });

  it('should format date', async () => {
    {
      const agent = await handler.createAgent({
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
      });
      Helpers.needsClosing.push(agent);

      await agent.goto(`${koaServer.baseUrl}`);

      const formatted = 'Sat Nov 19 2016 10:12:34 GMT-0800 (Pacific Standard Time)';

      const result = await agent.getJsValue(`new Date(1479579154987).toString()`);
      expect(result.value).toBe(formatted);
    }
    {
      const agent = await handler.createAgent({
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      });
      Helpers.needsClosing.push(agent);

      await agent.goto(`${koaServer.baseUrl}`);

      const formatted = 'Sat Nov 19 2016 19:12:34 GMT+0100 (Mitteleuropäische Normalzeit)';
      const result = await agent.getJsValue(`new Date(1479579154987).toString()`);
      expect(result.value).toBe(formatted);
    }
  });
});

describe('setScreensize', () => {
  it('should set the proper viewport size', async () => {
    const windowFraming = {
      screenGapLeft: 0,
      screenGapTop: 0,
      screenGapRight: 0,
      screenGapBottom: 0,
      frameBorderWidth: 0,
      frameBorderHeight: 0,
    };
    const viewport = Viewports.getDefault(windowFraming, windowFraming);
    const agent = await new SecretAgent({
      viewport,
    });
    Helpers.needsClosing.push(agent);

    await agent.goto(`${koaServer.baseUrl}`);
    const screenWidth = await agent.getJsValue('screen.width');
    expect(screenWidth.value).toBe(viewport.screenWidth);
    const screenHeight = await agent.getJsValue('screen.height');
    expect(screenHeight.value).toBe(viewport.screenHeight);

    const screenX = await agent.getJsValue('screenX');
    expect(screenX.value).toBe(viewport.positionX);
    const screenY = await agent.getJsValue('screenY');
    expect(screenY.value).toBe(viewport.positionY);

    const innerWidth = await agent.getJsValue('innerWidth');
    expect(innerWidth.value).toBe(viewport.width);
    const innerHeight = await agent.getJsValue('innerHeight');
    expect(innerHeight.value).toBe(viewport.height);
  });

  it('should support Media Queries', async () => {
    const agent = await handler.createAgent({
      viewport: {
        width: 200,
        height: 200,
        screenWidth: 200,
        screenHeight: 200,
        positionY: 0,
        positionX: 0,
      },
    });
    Helpers.needsClosing.push(agent);

    async function getQueryValue(mediaQuery: string) {
      const result = await agent.getJsValue(mediaQuery);
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
