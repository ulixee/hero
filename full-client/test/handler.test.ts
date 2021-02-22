import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import Core, { Session } from '@secret-agent/core/index';
import CoreProcess from '@secret-agent/core/lib/CoreProcess';
import DisconnectedFromCoreError from '@secret-agent/client/connections/DisconnectedFromCoreError';
import { Agent, RemoteConnectionToCore } from '@secret-agent/client/index';
import { createPromise } from '@secret-agent/commons/utils';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  await Core.start();
  koaServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);

describe('Full client Handler', () => {
  it('allows you to run concurrent tasks', async () => {
    const concurrency = 5;
    const handler = new Handler({
      maxConcurrency: concurrency,
      host: await Core.server.address,
    });
    Helpers.onClose(() => handler.close());
    const sessionsRunning = new Map<string, boolean>();
    let hasReachedMax = false;
    const runningAtSameTime: string[][] = [];

    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      handler.dispatchAgent(async agent => {
        const sessionId = await agent.sessionId;
        sessionsRunning.set(sessionId, true);
        const concurrent: string[] = [];
        for (const [session, isRunning] of sessionsRunning) {
          if (isRunning) concurrent.push(session);
        }
        runningAtSameTime.push(concurrent);
        await agent.goto(koaServer.baseUrl);
        await agent.document.title;

        while (!hasReachedMax && runningAtSameTime.length < concurrency) {
          await new Promise(setImmediate);
        }

        hasReachedMax = true;
        sessionsRunning.set(sessionId, false);
      });
    }

    await handler.waitForAllDispatches();

    expect(runningAtSameTime.filter(x => x.length > concurrency)).toHaveLength(0);

    await handler.close();
  });

  it('waits for an agent to close that is checked out', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
      host: await Core.server.address,
    });
    Helpers.needsClosing.push(handler);

    const agent1 = await handler.createAgent();
    const agent2 = await handler.createAgent();
    await expect(agent1.sessionId).resolves.toBeTruthy();
    await expect(agent2.sessionId).resolves.toBeTruthy();
    const agent3 = handler.createAgent();

    async function isAgent3Available(millis = 100): Promise<boolean> {
      const result = await Promise.race([
        agent3,
        new Promise(resolve => setTimeout(() => resolve('not avail'), millis)),
      ]);
      return result !== 'not avail';
    }

    await expect(isAgent3Available(0)).resolves.toBe(false);

    await agent1.close();

    await expect(isAgent3Available(5e3)).resolves.toBe(true);
  });
});

describe('waitForAllDispatches', () => {
  it('should not wait for an agent created through createAgent', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
      host: await Core.server.address,
    });
    Helpers.onClose(() => handler.close(), true);

    const agent1 = await handler.createAgent();
    let counter = 0;
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      handler.dispatchAgent(async () => {
        counter += 1;
        handler.dispatchAgent(async () => {
          counter += 1;
          await new Promise(resolve => setTimeout(resolve, 25 * Math.random()));
        });
        await new Promise(resolve => setTimeout(resolve, 25 * Math.random()));
      });
    }

    await handler.waitForAllDispatches();
    expect(counter).toBe(10);
    expect(await agent1.sessionId).toBeTruthy();
  });

  it('should bubble up errors that occur when waiting for all', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
      host: await Core.server.address,
    });
    Helpers.onClose(() => handler.close(), true);

    const agent1 = await handler.createAgent();

    const tab = Session.getTab({
      sessionId: await agent1.sessionId,
      tabId: await agent1.activeTab.tabId,
    });
    jest.spyOn(tab, 'goto').mockImplementation(async url => {
      throw new Error(`invalid url "${url}"`);
    });

    await expect(agent1.goto('any url')).rejects.toThrow('invalid url "any url"');

    handler.dispatchAgent(async agent => {
      const tab2 = Session.getTab({
        sessionId: await agent.sessionId,
        tabId: await agent.activeTab.tabId,
      });
      jest.spyOn(tab2, 'goto').mockImplementation(async url => {
        throw new Error(`invalid url "${url}"`);
      });

      await agent.goto('any url 2');
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
    Helpers.onClose(() => handler.close(), true);

    let failedAgentSessionId: string;
    handler.dispatchAgent(
      async agent => {
        failedAgentSessionId = await agent.sessionId;
        const tab = Session.getTab({
          sessionId: failedAgentSessionId,
          tabId: await agent.activeTab.tabId,
        });
        jest.spyOn(tab, 'goto').mockImplementation(async url => {
          throw new Error(`invalid url "${url}"`);
        });

        await agent.goto('any url 2');
      },
      { test: 1 },
    );

    handler.dispatchAgent(
      async agent => {
        await agent.goto(koaServer.baseUrl);
      },
      { test: 2 },
    );

    const dispatchResult = await handler.waitForAllDispatchesSettled();
    expect(Object.keys(dispatchResult)).toHaveLength(2);
    expect(dispatchResult[failedAgentSessionId]).toBeTruthy();
    expect(dispatchResult[failedAgentSessionId].error).toBeTruthy();
    expect(dispatchResult[failedAgentSessionId].error.message).toMatch('invalid url');
    expect(dispatchResult[failedAgentSessionId].args).toStrictEqual({ test: 1 });
  });
});

describe('connectionToCore', () => {
  it('handles disconnects from killed core server', async () => {
    const coreHost = await CoreProcess.spawn({});
    Helpers.onClose(() => CoreProcess.kill());
    const connection = new RemoteConnectionToCore({
      maxConcurrency: 2,
      host: coreHost,
    });
    await connection.connect();

    const handler = new Handler(connection);
    Helpers.needsClosing.push(handler);

    const waitForGoto = createPromise();
    let dispatchError: Error = null;
    handler.dispatchAgent(async agent => {
      try {
        await agent.goto(koaServer.baseUrl);
        const promise = agent.waitForMillis(10e3);
        waitForGoto.resolve();
        await promise;
      } catch (error) {
        dispatchError = error;
        throw error;
      }
    });
    await waitForGoto.promise;
    await CoreProcess.kill('SIGINT');
    await expect(handler.waitForAllDispatches()).rejects.toThrowError(DisconnectedFromCoreError);
    expect(dispatchError).toBeTruthy();
    expect(dispatchError).toBeInstanceOf(DisconnectedFromCoreError);
    expect((dispatchError as DisconnectedFromCoreError).coreHost).toBe(coreHost);
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
    handler.dispatchAgent(async agent => {
      try {
        await agent.goto(koaServer.baseUrl);
        const promise = agent.waitForMillis(10e3);
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
    expect(dispatchError).toBeTruthy();
    expect(dispatchError).toBeInstanceOf(DisconnectedFromCoreError);
    expect((dispatchError as DisconnectedFromCoreError).coreHost).toBe(coreHost);
  });

  it('can close without waiting for dispatches', async () => {
    const spawnedCoreHost = await CoreProcess.spawn({});
    Helpers.onClose(() => CoreProcess.kill());
    const coreHost = await Core.server.address;

    const handler = new Handler({ host: coreHost }, { host: spawnedCoreHost });
    Helpers.needsClosing.push(handler);

    const waits: Promise<any>[] = [];
    const waitForAgent = async (agent: Agent, waitForGoto: IResolvablePromise<any>) => {
      await agent.goto(koaServer.baseUrl);

      // don't wait
      const promise = agent.waitForMillis(10e3);
      waitForGoto.resolve();
      await promise;
    };
    for (let i = 0; i < 10; i += 1) {
      const waitForGoto = createPromise();
      waits.push(waitForGoto.promise);
      handler.dispatchAgent(waitForAgent, waitForGoto);
    }

    await Promise.all(waits);

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
    Helpers.onClose(() => CoreProcess.kill());
    await expect(handler.addConnectionToCore({ host: spawnedCoreHost })).resolves.toBeUndefined();

    expect(await handler.coreHosts).toHaveLength(2);

    const disconnectSpy = jest.spyOn(connection, 'disconnect');

    await handler.removeConnectionToCore(String(await connection.hostOrError));

    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    expect(await handler.coreHosts).toHaveLength(1);

    await handler.close();
  });
});
