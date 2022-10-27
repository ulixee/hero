import { Helpers } from '@ulixee/hero-testing/index';
import Core from '../index';
import Session from '../lib/Session';

const shutdownSpy = jest.spyOn(Core, 'shutdown');
afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('basic Core tests', () => {
  it('starts, configures, and shuts down', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentClientCount: 5 });

    expect(Core.pool.maxConcurrentAgents).toBe(5);
    expect(Core.pool.activeAgentsCount).toBe(0);

    await Core.shutdown();
  });

  it('runs createTab', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentClientCount: 2 });
    await connection.createSession();

    expect(Core.pool.maxConcurrentAgents).toBe(2);
    expect(Core.pool.activeAgentsCount).toBe(1);

    await Core.shutdown();
    expect(Core.pool.activeAgentsCount).toBe(0);
  });

  it('shuts down if connect set to be not persistent and Core.start not called', async () => {
    shutdownSpy.mockClear();

    Core.autoShutdownMillis = 10;
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
    expect(Core.pool.activeAgentsCount).toBe(0);
    Core.autoShutdownMillis = 30e3;
  });

  it('will not shutdown if start called and there are no open connections', async () => {
    shutdownSpy.mockClear();
    await Core.start();
    Core.autoShutdownMillis = 10;

    const connection = Core.addConnection();
    await connection.connect();
    const connectionCloseSpy = jest.spyOn(connection, 'disconnect');

    const { sessionId } = await connection.createSession();
    await Session.get(sessionId).close();

    await connection.disconnect();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(shutdownSpy).toHaveBeenCalledTimes(0);
    expect(connectionCloseSpy).toHaveBeenCalledTimes(1);
    await Core.shutdown();
    expect(Core.pool.activeAgentsCount).toBe(0);
    Core.autoShutdownMillis = 30e3;
  });

  it('can subscribe to Sessions created and closed', async () => {
    const newSession = jest.fn();
    const closedSession = jest.fn();
    Session.events.on('new', newSession);
    Session.events.on('closed', closedSession);
    const { session } = await Session.create({});
    Helpers.needsClosing.push(session);
    expect(newSession).toHaveBeenCalledTimes(1);
    expect(newSession.mock.calls[0]).toBeTruthy();
    await session.close();
    await new Promise(setImmediate);
    expect(closedSession).toHaveBeenCalledTimes(1);
    expect(closedSession.mock.calls[0][0].id).toBe(session.id);
    expect(closedSession.mock.calls[0][0].databasePath).toBeTruthy();
  });
});
