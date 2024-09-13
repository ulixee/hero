import Pool from '@ulixee/unblocked-agent/lib/Pool';
import { Helpers, TestLogger } from '@ulixee/unblocked-agent-testing';
import { ITestKoaServer } from '@ulixee/unblocked-agent-testing/helpers';
import BrowserEmulator from '../index';
import Viewports from '../lib/Viewports';

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

describe('basic Screen emulation tests', () => {
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
    const agent = pool.createAgent({
      logger,
      options: { viewport },
    });
    Helpers.needsClosing.push(agent);

    const page = await agent.newPage();
    await page.goto(`${koaServer.baseUrl}`);
    const screenWidth = await page.evaluate('screen.width');
    expect(screenWidth).toBe(viewport.screenWidth);
    const screenHeight = await page.evaluate('screen.height');
    expect(screenHeight).toBe(viewport.screenHeight);

    const screenX = await page.evaluate('screenX');
    expect(screenX).toBe(viewport.positionX);
    const screenY = await page.evaluate('screenY');
    expect(screenY).toBe(viewport.positionY);

    const innerWidth = await page.evaluate('innerWidth');
    expect(innerWidth).toBe(viewport.width);
    const innerHeight = await page.evaluate('innerHeight');
    expect(innerHeight).toBe(viewport.height);
  });

  it('should support Media Queries', async () => {
    const agent = pool.createAgent({
      logger,
      options: {
        viewport: {
          width: 200,
          height: 200,
          screenWidth: 200,
          screenHeight: 200,
          positionY: 0,
          positionX: 0,
        },
      },
    });
    Helpers.needsClosing.push(agent);

    const page = await agent.newPage();
    expect(await page.evaluate(`matchMedia('(min-device-width: 100px)').matches`)).toBe(true);
    expect(await page.evaluate(`matchMedia('(min-device-width: 300px)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(max-device-width: 100px)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(max-device-width: 300px)').matches`)).toBe(true);
    expect(await page.evaluate(`matchMedia('(device-width: 500px)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(device-width: 200px)').matches`)).toBe(true);

    expect(await page.evaluate(`matchMedia('(min-device-height: 100px)').matches`)).toBe(true);
    expect(await page.evaluate(`matchMedia('(min-device-height: 300px)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(max-device-height: 100px)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(max-device-height: 300px)').matches`)).toBe(true);
    expect(await page.evaluate(`matchMedia('(device-height: 500px)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(device-height: 200px)').matches`)).toBe(true);
  });

  it('should emulate the hover media feature', async () => {
    const agent = pool.createAgent({ logger });
    Helpers.needsClosing.push(agent);

    const page = await agent.newPage();
    expect(await page.evaluate(`matchMedia('(hover: none)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(hover: hover)').matches`)).toBe(true);
    expect(await page.evaluate(`matchMedia('(any-hover: none)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(any-hover: hover)').matches`)).toBe(true);
    expect(await page.evaluate(`matchMedia('(pointer: coarse)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(pointer: fine)').matches`)).toBe(true);
    expect(await page.evaluate(`matchMedia('(any-pointer: coarse)').matches`)).toBe(false);
    expect(await page.evaluate(`matchMedia('(any-pointer: fine)').matches`)).toBe(true);
  });
});
