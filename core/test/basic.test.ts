import { Helpers } from '@ulixee/hero-testing/index';
import Core, { GlobalPool } from '../index';
import Session from '../lib/Session';

const shutdownSpy = jest.spyOn(Core, 'shutdown');
beforeEach(() => {
  GlobalPool.maxConcurrentClientCount = 10;
});
afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('basic Core tests', () => {
  it('starts, configures, and shuts down', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentClientCount: 5 });

    expect(GlobalPool.maxConcurrentClientCount).toBe(5);
    expect(GlobalPool.activeSessionCount).toBe(0);

    await Core.shutdown();
  });

  it('runs createTab', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentClientCount: 2 });
    await connection.createSession();

    expect(GlobalPool.maxConcurrentClientCount).toBe(2);
    expect(GlobalPool.activeSessionCount).toBe(1);

    await Core.shutdown();
    expect(GlobalPool.activeSessionCount).toBe(0);
  });

  it('shuts down if connect set to be not persistent and Core.start not called', async () => {
    shutdownSpy.mockClear();

    const connection = Core.addConnection();
    await connection.connect({ isPersistent: false });
    Helpers.onClose(() => connection.disconnect());
    const connectionCloseSpy = jest.spyOn(connection, 'disconnect');
    connection.autoShutdownMillis = 0;

    const { sessionId } = await connection.createSession();
    await Session.get(sessionId).close();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(shutdownSpy).toHaveBeenCalledTimes(1);
    expect(connectionCloseSpy).toHaveBeenCalled();
    await Core.shutdown();
    expect(GlobalPool.activeSessionCount).toBe(0);
  });

  it('will not shutdown if start called and there are no open connections', async () => {
    shutdownSpy.mockClear();
    await Core.start();

    const connection = Core.addConnection();
    await connection.connect();
    const connectionCloseSpy = jest.spyOn(connection, 'disconnect');

    const { sessionId } = await connection.createSession();
    await Session.get(sessionId).close();

    await connection.disconnect();

    expect(shutdownSpy).toHaveBeenCalledTimes(0);
    expect(connectionCloseSpy).toHaveBeenCalledTimes(1);
    await Core.shutdown();
    expect(GlobalPool.activeSessionCount).toBe(0);
  });
});
