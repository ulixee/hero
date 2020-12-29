import { Helpers } from '@secret-agent/testing/index';
import Core, { GlobalPool } from '../index';
import Session from '../lib/Session';

const shutdownSpy = jest.spyOn(Core, 'shutdown');

afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('basic Core tests', () => {
  it('starts, configures, and shuts down', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentAgentsCount: 5 });

    expect(GlobalPool.maxConcurrentAgentsCount).toBe(5);
    expect(GlobalPool.activeSessionCount).toBe(0);

    await Core.shutdown();
  });

  it('runs createTab', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentAgentsCount: 2 });
    await connection.createSession();

    expect(GlobalPool.maxConcurrentAgentsCount).toBe(2);
    expect(GlobalPool.activeSessionCount).toBe(1);

    await Core.shutdown();
  });

  it('shuts down if connect not called manually and Core.start not called', async () => {
    shutdownSpy.mockClear();

    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    const connectionCloseSpy = jest.spyOn(connection, 'disconnect');
    connection.autoShutdownMillis = 0;

    const { sessionId } = await connection.createSession();
    await Session.get(sessionId).close();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(shutdownSpy).toHaveBeenCalledTimes(1);
    expect(connectionCloseSpy).toHaveBeenCalled();
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
  });
});
