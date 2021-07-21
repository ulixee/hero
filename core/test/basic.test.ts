import { Helpers } from '@ulixee/hero-testing/index';
import Resolvable from '@ulixee/commons/Resolvable';
import Core, { GlobalPool } from '../index';
import Session from '../lib/Session';

const shutdownSpy = jest.spyOn(Core, 'shutdown');

afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('basic Core tests', () => {
  it('starts, configures, and shuts down', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentHeroesCount: 5 });

    expect(GlobalPool.maxConcurrentHeroesCount).toBe(5);
    expect(GlobalPool.activeSessionCount).toBe(0);

    await Core.shutdown();
  });

  it('runs createTab', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect({ maxConcurrentHeroesCount: 2 });
    await connection.createSession();

    expect(GlobalPool.maxConcurrentHeroesCount).toBe(2);
    expect(GlobalPool.activeSessionCount).toBe(1);

    await Core.shutdown();
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

  it('should be able to get multiple entries out of the pool', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    GlobalPool.maxConcurrentHeroesCount = 3;
    await connection.connect({ maxConcurrentHeroesCount: 3 });
    const httpServer = await Helpers.runHttpServer({
      addToResponse: response => {
        response.setHeader('Set-Cookie', 'ulixee=test1');
      },
    });
    expect(GlobalPool.maxConcurrentHeroesCount).toBe(3);
    expect(GlobalPool.activeSessionCount).toBe(0);

    const tab1 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab1.session);
    // #1
    await tab1.goto(httpServer.url);
    expect(GlobalPool.activeSessionCount).toBe(1);

    const tab2 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab2.session);

    // #2
    await tab2.goto(httpServer.url);
    expect(GlobalPool.activeSessionCount).toBe(2);

    const tab3 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab3.session);

    // #3
    await tab3.goto(httpServer.url);
    expect(GlobalPool.activeSessionCount).toBe(3);

    // #4
    const tab4Promise = connection.createSession();
    expect(GlobalPool.activeSessionCount).toBe(3);
    await tab1.session.close();
    const tab4Meta = await tab4Promise;
    const tab4 = Session.getTab(tab4Meta);
    Helpers.needsClosing.push(tab4.session);

    // should give straight to this waiting promise
    expect(GlobalPool.activeSessionCount).toBe(3);
    await tab4.goto(httpServer.url);
    await tab4.session.close();
    expect(GlobalPool.activeSessionCount).toBe(2);

    await Promise.all([tab1.session.close(), tab2.session.close(), tab3.session.close()]);
    expect(GlobalPool.activeSessionCount).toBe(0);
    await httpServer.close();
  }, 15e3);

  it('should emit events when all session tabs are closed', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    GlobalPool.maxConcurrentHeroesCount = 10;
    await connection.connect();
    const httpServer = await Helpers.runHttpServer();

    const tab = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab.session);
    await tab.goto(httpServer.url);
    const allTabsClosed = jest.fn();
    tab.session.on('all-tabs-closed', allTabsClosed);

    await tab.close();

    expect(allTabsClosed).toBeCalledTimes(1);
    await Core.shutdown();
  });

  it('should emit browser windows all closed event', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    GlobalPool.maxConcurrentHeroesCount = 10;
    await connection.connect();
    const httpServer = await Helpers.runHttpServer();

    const tab = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab.session);
    await tab.goto(httpServer.url);

    const tab2 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab2.session);
    await tab2.goto(httpServer.url);

    const browserWindowsClosed = jest.fn();

    GlobalPool.events.on('browser-closed-all-windows', ({ puppet }) => {
      browserWindowsClosed();
      return puppet.close();
    });

    await tab.close();

    expect(browserWindowsClosed).toBeCalledTimes(0);
    await tab2.close();
    expect(browserWindowsClosed).toBeCalledTimes(1);
    await Core.shutdown();
  });

  it('should emit all browsers closed event', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect();

    const tab = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab.session);

    const allBrowsersTriggered = new Resolvable<void>();
    const allBrowsersClosedEvent = jest.fn();
    GlobalPool.events.on('all-browsers-closed', () => {
      allBrowsersTriggered.resolve();
      allBrowsersClosedEvent();
    });

    // @ts-ignore
    const puppets = GlobalPool.puppets;
    expect(puppets).toHaveLength(1);

    const puppet1 = puppets[0];
    expect(allBrowsersClosedEvent).toBeCalledTimes(0);

    // @ts-ignore
    const puppet2 = await GlobalPool.getPuppet({
      ...puppet1.browserEngine,
      launchArguments: puppet1.browserEngine.launchArguments.slice(0, -1),
    });

    expect(puppets).toHaveLength(2);
    expect(allBrowsersClosedEvent).toBeCalledTimes(0);

    await tab.close();
    await puppet1.close();
    expect(allBrowsersClosedEvent).toBeCalledTimes(0);

    await puppet2.close();
    await allBrowsersTriggered.promise;
    expect(allBrowsersClosedEvent).toBeCalledTimes(1);
    await Core.shutdown();
  });
});
