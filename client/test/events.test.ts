import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import Resource from '../lib/Resource';
import { Handler } from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';

const sessionMeta = {
  tabId: 1,
  sessionId: 'session-id',
  sessionsDataLocation: '',
};

let testConnection: ConnectionToCore;
let spy: jest.SpyInstance;
beforeEach(() => {
  class TestConnection extends ConnectionToCore {
    async internalSendRequest({ command, messageId }: ICoreRequestPayload): Promise<void> {
      if (command === 'Session.create') {
        this.onMessage({ data: sessionMeta, responseId: messageId });
      } else if (command === 'Session.addEventListener') {
        this.onMessage({ data: { listenerId: 'listener-id' }, responseId: messageId });
      } else {
        this.onMessage({ data: {}, responseId: messageId });
      }
    }

    protected createConnection = () => Promise.resolve(null);
    protected destroyConnection = () => Promise.resolve(null);
  }
  testConnection = new TestConnection();
  spy = jest.spyOn<any, any>(testConnection, 'internalSendRequest');
});

describe('events', () => {
  it('receives close event', async () => {
    const handler = new Handler(testConnection);

    let isClosed = false;
    const agent = await handler.createAgent();
    await agent.on('close', () => {
      isClosed = true;
    });

    testConnection.onMessage({
      meta: { sessionId: 'session-id' },
      listenerId: 'listener-id',
      eventArgs: [],
    });
    await agent.close();

    const outgoingCommands = spy.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Session.create',
      'Session.addEventListener', // automatic close tracker
      'Session.addEventListener', // user added close listener
      'Session.close',
    ]);
    expect(isClosed).toBe(true);
  });

  it('adds and removes event listeners', async () => {
    const handler = new Handler(testConnection);

    let eventCount = 0;
    const agent = await handler.createAgent();

    const onResourceFn = (resource): void => {
      expect(resource).toBeInstanceOf(Resource);
      eventCount += 1;
    };

    await agent.activeTab.on('resource', onResourceFn);

    testConnection.onMessage({
      meta: sessionMeta,
      listenerId: 'listener-id',
      eventArgs: [
        {
          id: 1,
        } as IResourceMeta,
      ],
    });
    testConnection.onMessage({
      meta: sessionMeta,
      listenerId: 'listener-id',
      eventArgs: [
        {
          id: 2,
        } as IResourceMeta,
      ],
    });

    // need to wait since events are handled on a promise resolution
    await new Promise(setImmediate);
    expect(eventCount).toBe(2);

    await agent.activeTab.off('resource', onResourceFn);
    testConnection.onMessage({
      meta: sessionMeta,
      listenerId: 'listener-id',
      eventArgs: [
        {
          id: 3,
        } as IResourceMeta,
      ],
    });
    expect(eventCount).toBe(2);
  });
});
