import { Helpers } from '@ulixee/hero-testing/index';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import * as http from 'http';
import { ITestHttpServer } from '@ulixee/hero-testing/helpers';
import Core, { GlobalPool } from '../index';
import Session from '../lib/Session';

let httpServer: ITestHttpServer<http.Server>;

beforeAll(async () => {
  httpServer = await Helpers.runHttpServer({ onlyCloseOnFinal: true });
});
beforeEach(() => {
  GlobalPool.maxConcurrentClientCount = 10;
});
afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('GlobalPool tests', () => {
  it('should be able to get multiple entries out of the pool', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    GlobalPool.maxConcurrentClientCount = 3;
    await connection.connect({ maxConcurrentClientCount: 3 });
    expect(GlobalPool.maxConcurrentClientCount).toBe(3);
    expect(GlobalPool.activeSessionCount).toBe(0);

    const tab1 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab1.session);
    // #1
    await tab1.goto(`${httpServer.baseUrl}/pool1`);
    expect(GlobalPool.activeSessionCount).toBe(1);

    const tab2 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab2.session);

    // #2
    await tab2.goto(`${httpServer.baseUrl}/pool2`);
    expect(GlobalPool.activeSessionCount).toBe(2);

    const tab3 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab3.session);

    // #3
    await tab3.goto(`${httpServer.baseUrl}/pool3`);
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
    await tab4.goto(`${httpServer.baseUrl}/pool4`);
    await tab4.session.close();
    expect(GlobalPool.activeSessionCount).toBe(2);

    await Promise.all([tab1.session.close(), tab2.session.close(), tab3.session.close()]);
    expect(GlobalPool.activeSessionCount).toBe(0);
    await Core.shutdown();
  }, 15e3);

  it('should emit events when all session tabs are closed', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect();

    const tab = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${httpServer.baseUrl}/session-events`);
    const allTabsClosed = jest.fn();
    tab.session.on('all-tabs-closed', allTabsClosed);

    await tab.close();

    expect(allTabsClosed).toBeCalledTimes(1);
    await Core.shutdown();
  });

  it('should emit an event when a browser has no open windows', async () => {
    const connection = Core.addConnection();
    Helpers.onClose(() => connection.disconnect());
    await connection.connect();

    const tab = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab.session);
    await tab.goto(`${httpServer.baseUrl}/no-windows`);

    const tab2 = Session.getTab(await connection.createSession());
    Helpers.needsClosing.push(tab2.session);
    await tab2.goto(`${httpServer.baseUrl}/no-windows2`);

    const browserWindowsClosed = jest.fn();
    const didCallPromise = new Resolvable<void>();

    GlobalPool.events.on('browser-has-no-open-windows', () => {
      browserWindowsClosed();
      didCallPromise.resolve();
    });

    await tab.close();

    expect(browserWindowsClosed).toBeCalledTimes(0);
    await tab2.close();
    await didCallPromise.promise;
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
      browserEngine: {
        ...puppet1.browserEngine,
        launchArguments: puppet1.browserEngine.launchArguments.slice(0, -1),
      },
      onBrowserLaunchConfiguration(): Promise<void> {
        return Promise.resolve();
      },
      humanEmulator: { id: 'basic' },
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
