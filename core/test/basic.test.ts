import Core, { GlobalPool } from '../index';

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
});
