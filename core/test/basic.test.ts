import { Helpers } from '@ulixee/hero-testing/index';
import * as Fs from 'fs';
import Core, { Session } from '../index';

afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('basic Core tests', () => {
  it('starts, configures, and shuts down', async () => {
    const core = new Core();
    Helpers.onClose(core.close);
    const connection = core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentClientCount: 5 });

    expect(core.pool.maxConcurrentAgents).toBe(5);
    expect(core.pool.activeAgentsCount).toBe(0);

    await Core.shutdown();
  });

  it('runs createTab', async () => {
    const core = new Core();
    Helpers.onClose(core.close);
    const connection = core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentClientCount: 2 });
    await connection.createSession();

    expect(core.pool.maxConcurrentAgents).toBe(2);
    expect(core.pool.activeAgentsCount).toBe(1);

    const didClose = new Promise(resolve => Session.events.on('closed', resolve));
    await core.close();
    expect(core.pool.activeAgentsCount).toBe(0);
    await expect(didClose).resolves.toBeTruthy();
  });

  it('can delete session databases', async () => {
    const core = new Core();
    Helpers.onClose(core.close);
    const connection = core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentClientCount: 2 });
    const { session } = await Session.create({ sessionPersistence: false }, core);

    expect(Fs.existsSync(session.db.path)).toBe(true);
    await session.close();
    expect(Fs.existsSync(session.db.path)).toBe(false);
  });

  it('can subscribe to Sessions created and closed', async () => {
    const core = new Core();
    Helpers.onClose(core.close);
    const newSession = jest.fn();
    const closedSession = jest.fn();
    Session.events.on('new', newSession);
    Session.events.on('closed', closedSession);
    const { session } = await Session.create({}, core);
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
