import Core, { GlobalPool } from '../index';

const shutdownSpy = jest.spyOn(Core, 'shutdown');

describe('basic Core tests', () => {
  it('starts, configures, and shuts down', async () => {
    await Core.start();
    await Core.configure({ maxActiveSessionCount: 5 });

    expect(GlobalPool.maxActiveSessionCount).toBe(5);
    expect(GlobalPool.activeSessionCount).toBe(0);

    await Core.shutdown();
  });

  it('runs createSession', async () => {
    await Core.start();
    await Core.configure({ maxActiveSessionCount: 2 });
    await Core.createSession();

    expect(GlobalPool.maxActiveSessionCount).toBe(2);
    expect(GlobalPool.activeSessionCount).toBe(1);

    await Core.shutdown();
  });

  it('shuts down if start not called manually', async () => {
    // @ts-ignore
    Core.autoShutdownMillis = 0;
    shutdownSpy.mockClear();
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.close();
    await new Promise(r => setTimeout(r, 50));
    expect(shutdownSpy).toHaveBeenCalledTimes(1);
  });

  it('will not shutdown if start called and 0 sessions', async () => {
    // @ts-ignore
    Core.autoShutdownMillis = 0;
    shutdownSpy.mockClear();
    await Core.start();
    await Core.configure({ maxActiveSessionCount: 5 });
    const meta = await Core.createSession();
    const core = Core.byWindowId[meta.windowId];
    await core.close();
    await new Promise(r => setTimeout(r, 50));
    expect(shutdownSpy).toHaveBeenCalledTimes(0);
    await Core.shutdown();
  });

  it('will shutdown if start called, core disconnects and no open windows', async () => {
    // @ts-ignore
    Core.autoShutdownMillis = 0;
    shutdownSpy.mockClear();
    await Core.start();
    await Core.configure({ maxActiveSessionCount: 5 });
    const meta = await Core.createSession();
    await Core.disconnect([meta.windowId]);
    await new Promise(r => setTimeout(r, 50));
    expect(shutdownSpy).toHaveBeenCalledTimes(1);
    await Core.shutdown();
  });
});
