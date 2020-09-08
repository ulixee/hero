import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import { SecretAgentClientGenerator } from '../index';
import Resource from '../lib/Resource';

describe('events', () => {
  it('receives close event', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();
    const sessionMeta = {
      tabId: 'tab-id',
      sessionId: 'session-id',
      sessionsDataLocation: '',
    };
    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'createTab') {
        return { data: sessionMeta };
      }
      if (command === 'addEventListener') {
        return { data: { listenerId: 'listener-id' } };
      }
    });

    let isClosed = false;
    const browser = await SecretAgent.createBrowser();
    await browser.on('close', () => {
      isClosed = true;
    });

    await browser.close();
    coreClient.pipeIncomingEvent(sessionMeta, 'listener-id', []);

    const outgoingCommands = (coreClient.pipeOutgoingCommand as any).mock.calls;
    expect(outgoingCommands.map(c => c.slice(0, 2))).toMatchObject([
      [null, 'createTab'],
      [expect.any(Object), 'addEventListener'],
      [expect.any(Object), 'close'],
    ]);
    expect(isClosed).toBe(true);

    await SecretAgent.shutdown();
  });

  it('adds and removes event listeners', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();
    const sessionMeta = {
      tabId: 'tab-id',
      sessionId: 'session-id',
      sessionsDataLocation: '',
    };

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'createTab') {
        return { data: sessionMeta };
      }
      if (command === 'addEventListener') {
        return { data: { listenerId: 'listener-id' } };
      }
    });

    const browser = await SecretAgent.createBrowser();
    const onResourceFn = resource => {
      expect(resource).toBeInstanceOf(Resource);
      eventCount += 1;
    };

    let eventCount = 0;
    await browser.activeTab.on('resource', onResourceFn);

    coreClient.pipeIncomingEvent(sessionMeta, 'listener-id', [
      {
        id: 1,
      } as IResourceMeta,
    ]);
    coreClient.pipeIncomingEvent(sessionMeta, 'listener-id', [
      {
        id: 2,
      } as IResourceMeta,
    ]);
    expect(eventCount).toBe(2);

    await browser.activeTab.off('resource', onResourceFn);
    coreClient.pipeIncomingEvent(sessionMeta, 'listener-id', [
      {
        id: 3,
      } as IResourceMeta,
    ]);
    expect(eventCount).toBe(2);

    await SecretAgent.shutdown();
  });
});
