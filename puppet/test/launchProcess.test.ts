import Log from '@secret-agent/commons/Logger';
import CorePlugins from '@secret-agent/core/lib/CorePlugins';
import { IBoundLog } from '@secret-agent/interfaces/ILog';
import Core from '@secret-agent/core';
import Puppet from '../index';
import CustomBrowserEmulator from './_CustomBrowserEmulator';

const { log } = Log(module);
const browserEmulatorId = CustomBrowserEmulator.id;

describe('launchProcess', () => {
  beforeAll(async () => {
    Core.use(CustomBrowserEmulator);
  });

  it('should reject all promises when browser is closed', async () => {
    const browserEngine = CustomBrowserEmulator.selectBrowserMeta().browserEngine;
    const browser = await new Puppet(browserEngine);
    await browser.start();
    const plugins = new CorePlugins({ browserEmulatorId }, log as IBoundLog);
    const page = await (await browser.newContext(plugins, log)).newPage();
    let error = null;
    const neverResolves = page.evaluate(`new Promise(r => {})`).catch(e => (error = e));
    await page.evaluate(`new Promise(f => setTimeout(f, 0))`);
    await browser.close();
    await neverResolves;
    expect(error.message).toContain('Cancel Pending Promise');
  });

  it('should reject if executable path is invalid', async () => {
    const browserEngine = CustomBrowserEmulator.selectBrowserMeta().browserEngine;
    browserEngine.executablePath = 'random-invalid-path';
    const browser = new Puppet(browserEngine);
    await expect(browser.start()).rejects.toThrowError('Failed to launch');
  });

  it('should be callable twice', async () => {
    const browserEngine = CustomBrowserEmulator.selectBrowserMeta().browserEngine;
    const browser = await new Puppet(browserEngine);
    await Promise.all([browser.close(), browser.close()]);
    await expect(browser.close()).resolves.toBe(undefined);
  });
});
