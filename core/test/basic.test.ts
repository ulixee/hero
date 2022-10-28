import { Helpers } from '@ulixee/hero-testing/index';
import Core, { Session } from '../index';

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

    const didClose = new Promise(resolve => Session.events.on('closed', resolve));
    await Core.shutdown();
    expect(Core.pool.activeAgentsCount).toBe(0);
    await didClose;
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
