import { Helpers } from '@secret-agent/testing';
import { ITestKoaServer } from '@secret-agent/testing/helpers';
import { Session } from '@secret-agent/core/index';
import Tab from '@secret-agent/core/lib/Tab';
import { Handler } from '../index';

let koaServer: ITestKoaServer;
beforeAll(async () => {
  koaServer = await Helpers.runKoaServer(true);
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('Full client Handler', () => {
  it('allows you to run concurrent tasks', async () => {
    const concurrency = 5;
    const handler = new Handler({
      maxConcurrency: concurrency,
    });
    Helpers.onClose(() => handler.close(), true);
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

    await expect(isAgent3Available(1e3)).resolves.toBe(true);
  });
});
describe('waitForAllDispatches', () => {
  it('should not wait for an agent created through createAgent', async () => {
    const handler = new Handler({
      maxConcurrency: 2,
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
