import { Helpers } from '@secret-agent/testing/index';
import Core, { GlobalPool } from '../index';

const shutdownSpy = jest.spyOn(Core, 'shutdown');

afterAll(Helpers.afterAll);

describe('basic Core tests', () => {
  it('starts, configures, and shuts down', async () => {
    await Core.prewarm();
    await Core.configure({ maxConcurrentSessionsCount: 5 });

    expect(GlobalPool.maxConcurrentSessionsCount).toBe(5);
    expect(GlobalPool.activeSessionCount).toBe(0);

    await Core.shutdown();
  });

  it('runs createTab', async () => {
    await Core.prewarm();
    await Core.configure({ maxConcurrentSessionsCount: 2 });
    await Core.createTab();

    expect(GlobalPool.maxConcurrentSessionsCount).toBe(2);
    expect(GlobalPool.activeSessionCount).toBe(1);

    await Core.shutdown();
  });

  it('shuts down if start not called manually', async () => {
    // @ts-ignore
    Core.autoShutdownMillis = 0;
    shutdownSpy.mockClear();
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    await core.close();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(shutdownSpy).toHaveBeenCalledTimes(1);
  });

  it('will not shutdown if start called and 0 sessions', async () => {
    // @ts-ignore
    Core.autoShutdownMillis = 0;
    shutdownSpy.mockClear();
    await Core.prewarm();
    await Core.configure({ maxConcurrentSessionsCount: 5 });
    const meta = await Core.createTab();
    const core = Core.byTabId[meta.tabId];
    await core.close();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(shutdownSpy).toHaveBeenCalledTimes(0);
    await Core.shutdown();
  });

  it('will shutdown if start called, core disconnects and no open windows', async () => {
    // @ts-ignore
    Core.autoShutdownMillis = 0;
    shutdownSpy.mockClear();
    await Core.prewarm();
    await Core.configure({ maxConcurrentSessionsCount: 5 });
    const meta = await Core.createTab();
    await Core.disconnect([meta.tabId]);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(shutdownSpy).toHaveBeenCalledTimes(1);
    await Core.shutdown();
  });
});
