import { Helpers } from '@ulixee/testing';
import { ITestKoaServer } from '@ulixee/testing/helpers';
import Core, { CoreProcess, Session } from '@ulixee/hero-core/index';
import DisconnectedFromCoreError from '@ulixee/hero/connections/DisconnectedFromCoreError';
import { Hero, RemoteConnectionToCore } from '@ulixee/hero/index';
import { createPromise } from '@ulixee/commons/utils';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer(true);
});
afterEach(Helpers.afterEach);
afterAll(Helpers.afterAll);

describe('Full client Handler', () => {
  it('allows you to run concurrent tasks', async () => {
    koaServer.get('/handler', ctx => {
      ctx.body = `<html><head><title>Handler page</title></head><body><h1>Here</h1></body></html>`;
    });
    const concurrency = 5;
    const handler = new Handler({
      maxConcurrency: concurrency,
      host: await Core.server.address,
    });
    Helpers.needsClosing.push(handler);
    const sessionsRunning = new Map<string, boolean>();
    let hasReachedMax = false;
    const runningAtSameTime: string[][] = [];

    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      handler.dispatchHero(async hero => {
        const sessionId = await hero.sessionId;
        sessionsRunning.set(sessionId, true);
        const concurrent: string[] = [];
        for (const [session, isRunning] of sessionsRunning) {
          if (isRunning) concurrent.push(session);
        }
        runningAtSameTime.push(concurrent);
        await hero.goto(`${koaServer.baseUrl}/handler`);
        await hero.document.title;

        while (!hasReachedMax && runningAtSameTime.length < concurrency) {
          await new Promise(setImmediate);
        }

        hasReachedMax = true;
        sessionsRunning.set(sessionId, false);
      });
    }

    await handler.waitForAllDispatches();

    expect(runningAtSameTime.filter(x => x.length > concurrency)).toHaveLength(0);
  });

  it('waits for an hero to close that is checked out', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
      host: await Core.server.address,
    });
    Helpers.needsClosing.push(handler);

    const hero1 = await handler.createHero();
    const hero2 = await handler.createHero();
    await expect(hero1.sessionId).resolves.toBeTruthy();
    await expect(hero2.sessionId).resolves.toBeTruthy();
    const hero3 = handler.createHero();

    Helpers.needsClosing.push(hero2);

    async function isHero3Available(millis = 100): Promise<boolean> {
      const result = await Promise.race([
        hero3,
        new Promise(resolve => setTimeout(() => resolve('not avail'), millis)),
      ]);
      return result !== 'not avail';
    }

    await expect(isHero3Available(0)).resolves.toBe(false);

    await hero1.close();

    await expect(isHero3Available(5e3)).resolves.toBe(true);
    await (await hero3).close();
  });
});

describe('waitForAllDispatches', () => {
  it('should not wait for an hero created through createHero', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
      host: await Core.server.address,
    });
    Helpers.needsClosing.push(handler);

    const hero1 = await handler.createHero();
    let counter = 0;
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      handler.dispatchHero(async () => {
        counter += 1;
        handler.dispatchHero(async () => {
          counter += 1;
          await new Promise(resolve => setTimeout(resolve, 25 * Math.random()));
        });
        await new Promise(resolve => setTimeout(resolve, 25 * Math.random()));
      });
    }

    const results = await handler.waitForAllDispatches();
    expect(results).toHaveLength(10);
    expect(counter).toBe(10);
    expect(await hero1.sessionId).toBeTruthy();
  });

  it('should bubble up errors that occur when waiting for all', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
      host: await Core.server.address,
    });
    Helpers.needsClosing.push(handler);

    const hero1 = await handler.createHero();

    const tab = Session.getTab({
      sessionId: await hero1.sessionId,
      tabId: await hero1.activeTab.tabId,
    });
    jest.spyOn(tab, 'goto').mockImplementation(async url => {
      throw new Error(`invalid url "${url}"`);
    });

    await expect(hero1.goto('any url')).rejects.toThrow('invalid url "any url"');

    handler.dispatchHero(async hero => {
      const tab2 = Session.getTab({
        sessionId: await hero.sessionId,
        tabId: await hero.activeTab.tabId,
      });
      jest.spyOn(tab2, 'goto').mockImplementation(async url => {
        throw new Error(`invalid url "${url}"`);
      });

      await hero.goto('any url 2');
    });

    await expect(handler.waitForAllDispatches()).rejects.toThrow('invalid url "any url 2"');
  });
});

describe('waitForAllDispatchesSettled', () => {
  it('should return all successful and error dispatches', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
      host: await Core.server.address,
    });
    Helpers.needsClosing.push(handler);

    let failedHeroSessionId: string;
    handler.dispatchHero(
      async hero => {
        failedHeroSessionId = await hero.sessionId;
        const tab = Session.getTab({
          sessionId: failedHeroSessionId,
          tabId: await hero.activeTab.tabId,
        });
        jest.spyOn(tab, 'goto').mockImplementation(async url => {
          throw new Error(`invalid url "${url}"`);
        });

        await hero.goto('any url 2');
      },
      { input: { test: 1 } },
    );

    handler.dispatchHero(
      async hero => {
        await hero.goto(koaServer.baseUrl);
        hero.output = { result: 1 };
      },
      { input: { test: 1 } },
    );

    const dispatchResult = await handler.waitForAllDispatchesSettled();
    expect(dispatchResult).toHaveLength(2);
    expect(dispatchResult[0].error).toBeTruthy();
    expect(dispatchResult[0].error.message).toMatch('invalid url');
    expect(dispatchResult[0].options.input).toStrictEqual({
      test: 1,
    });

    expect(dispatchResult[1].error).not.toBeTruthy();
    expect(dispatchResult[1].output).toStrictEqual({ result: 1 });
  });
});

describe('connectionToCore', () => {
  it('handles disconnects from killed core server', async () => {
    const coreHost = await CoreProcess.spawn({});
    Helpers.onClose(() => CoreProcess.kill('SIGINT'));
    const connection = new RemoteConnectionToCore({
      maxConcurrency: 2,
      host: coreHost,
    });
    await connection.connect();

    const handler = new Handler(connection);
    Helpers.needsClosing.push(handler);

    const waitForGoto = createPromise();
    const dispatchErrorPromise = createPromise<Error>();
    handler.dispatchHero(async hero => {
      try {
        await hero.goto(koaServer.baseUrl);
        const promise = hero.waitForMillis(10e3);
        await new Promise(resolve => setTimeout(resolve, 50));
        waitForGoto.resolve();
        await promise;
      } catch (error) {
        dispatchErrorPromise.resolve(error);
        throw error;
      }
    });
    await waitForGoto.promise;
    await CoreProcess.kill('SIGINT');
    await new Promise(setImmediate);
    await expect(dispatchErrorPromise).resolves.toBeTruthy();
    const dispatchError = await dispatchErrorPromise;
    expect(dispatchError).toBeInstanceOf(DisconnectedFromCoreError);
    expect((dispatchError as DisconnectedFromCoreError).coreHost).toBe(coreHost);
    await expect(handler.waitForAllDispatches()).rejects.toThrowError(DisconnectedFromCoreError);
  });

  it('handles disconnects from client', async () => {
    const coreHost = await CoreProcess.spawn({});
    Helpers.onClose(() => CoreProcess.kill('SIGINT'));
    const connection = new RemoteConnectionToCore({
      maxConcurrency: 2,
      host: coreHost,
    });
    await connection.connect();

    const handler = new Handler(connection);
    Helpers.needsClosing.push(handler);

    const waitForGoto = createPromise();
    const dispatchErrorPromise = createPromise<Error>();
    handler.dispatchHero(async hero => {
      try {
        await hero.goto(koaServer.baseUrl);
        const promise = hero.waitForMillis(10e3);
        await new Promise(resolve => setTimeout(resolve, 50));
        waitForGoto.resolve();
        await promise;
      } catch (error) {
        dispatchErrorPromise.resolve(error);
        throw error;
      }
    });
    await waitForGoto.promise;
    await connection.disconnect();
    await new Promise(setImmediate);
    await expect(dispatchErrorPromise).resolves.toBeTruthy();
    const dispatchError = await dispatchErrorPromise;
    expect(dispatchError).toBeInstanceOf(DisconnectedFromCoreError);
    expect((dispatchError as DisconnectedFromCoreError).coreHost).toBe(coreHost);
    await expect(handler.waitForAllDispatches()).rejects.toThrowError(DisconnectedFromCoreError);
  });

  it('handles core server ending websocket (econnreset)', async () => {
    const coreHost = await Core.server.address;
    // @ts-ignore
    const sockets = new Set(Core.server.sockets);

    const connection = new RemoteConnectionToCore({
      maxConcurrency: 2,
      host: coreHost,
    });
    await connection.connect();
    // @ts-ignore
    const newSockets = [...Core.server.sockets];

    const socket = newSockets.find(x => !sockets.has(x));

    const handler = new Handler(connection);
    Helpers.needsClosing.push(handler);

    const waitForGoto = createPromise();
    let dispatchError: Error = null;
    handler.dispatchHero(async hero => {
      try {
        await hero.goto(koaServer.baseUrl);
        const promise = hero.waitForMillis(10e3);
        waitForGoto.resolve();
        await promise;
      } catch (error) {
        dispatchError = error;
        throw error;
      }
    });

    await waitForGoto.promise;
    socket.destroy();
    await expect(handler.waitForAllDispatches()).rejects.toThrowError(DisconnectedFromCoreError);
    await new Promise(setImmediate);
    expect(dispatchError).toBeTruthy();
    expect(dispatchError).toBeInstanceOf(DisconnectedFromCoreError);
    expect((dispatchError as DisconnectedFromCoreError).coreHost).toBe(coreHost);
  });

  it('can close without waiting for dispatches', async () => {
    const spawnedCoreHost = await CoreProcess.spawn({});
    Helpers.onClose(() => CoreProcess.kill('SIGINT'));
    const coreHost = await Core.server.address;

    const localConn = new RemoteConnectionToCore({ host: coreHost, maxConcurrency: 2 });
    const spawnedConn = new RemoteConnectionToCore({ host: spawnedCoreHost, maxConcurrency: 2 });
    await localConn.connect();
    await spawnedConn.connect();
    const handler = new Handler(localConn, spawnedConn);
    Helpers.needsClosing.push(handler);

    let spawnedConnections = 0;
    let localConnections = 0;

    const waits: Promise<any>[] = [];
    const waitForHero = async (hero: Hero) => {
      await hero.goto(koaServer.baseUrl);
      const host = await hero.coreHost;
      if (host === spawnedCoreHost) spawnedConnections += 1;
      else localConnections += 1;

      // don't wait
      const promise = hero.waitForMillis(10e3);
      hero.input.resolve();
      await expect(promise).rejects.toThrowError('Disconnected');
    };
    for (let i = 0; i < 4; i += 1) {
      const waitForGoto = createPromise();
      waits.push(waitForGoto.promise);
      handler.dispatchHero(waitForHero, { input: waitForGoto });
    }

    await Promise.all(waits);
    expect(spawnedConnections).toBe(2);
    expect(localConnections).toBe(2);

    // kill off one of the cores
    await CoreProcess.kill('SIGINT');
    // should still be able to close
    await expect(handler.close()).resolves.toBeUndefined();
  });

  it('can add and remove connections', async () => {
    const coreHost = await Core.server.address;

    const connection = new RemoteConnectionToCore({
      maxConcurrency: 2,
      host: coreHost,
    });
    await connection.connect();

    const handler = new Handler(connection);
    Helpers.needsClosing.push(handler);

    expect(await handler.coreHosts).toHaveLength(1);

    const spawnedCoreHost = await CoreProcess.spawn({});
    Helpers.onClose(() => CoreProcess.kill('SIGINT'));
    await expect(handler.addConnectionToCore({ host: spawnedCoreHost })).resolves.toBeUndefined();

    expect(await handler.coreHosts).toHaveLength(2);

    const disconnectSpy = jest.spyOn(connection, 'disconnect');

    await handler.removeConnectionToCore(String(await connection.hostOrError));

    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    expect(await handler.coreHosts).toHaveLength(1);

    await handler.close();
  });

  it('can re-queue dispatched heros that never started', async () => {
    const coreHost = await CoreProcess.spawn({});
    Helpers.onClose(() => CoreProcess.kill('SIGINT'));
    const connection1 = new RemoteConnectionToCore({
      maxConcurrency: 1,
      host: coreHost,
    });
    await connection1.connect();

    const handler = new Handler(connection1);
    Helpers.needsClosing.push(handler);

    const waitForGoto = createPromise();
    const dispatchErrorPromise = createPromise<Error>();
    handler.dispatchHero(async hero => {
      try {
        await hero.goto(koaServer.baseUrl);
        // create a command we can disconnect from (don't await yet)
        const promise = hero.waitForMillis(5e3);
        await new Promise(resolve => setTimeout(resolve, 50));
        waitForGoto.resolve();
        await promise;
      } catch (error) {
        dispatchErrorPromise.resolve(error);
        throw error;
      }
    });

    let counter = 0;
    const incr = async hero => {
      await hero.goto(koaServer.baseUrl);
      counter += 1;
    };
    handler.dispatchHero(incr);
    handler.dispatchHero(incr);

    // first 2 will be queued against the first connection
    const coreHost2 = await Core.server.address;
    await handler.addConnectionToCore({ maxConcurrency: 2, host: coreHost2 });
    handler.dispatchHero(incr);
    handler.dispatchHero(incr);
    await waitForGoto.promise;

    // disconnect the first connection. the first two handlers should get re-queued
    await connection1.disconnect();
    await new Promise(setImmediate);

    // should have an error thrown if it actually the process. this one should NOT get re-queued
    await expect(dispatchErrorPromise).resolves.toBeTruthy();
    const dispatchError = await dispatchErrorPromise;
    expect(dispatchError).toBeInstanceOf(DisconnectedFromCoreError);

    const allDispatches = await handler.waitForAllDispatchesSettled();

    expect(counter).toBe(4);
    expect(Object.keys(allDispatches)).toHaveLength(5);
    expect(Object.values(allDispatches).filter(x => !!x.error)).toHaveLength(1);
  });
});
