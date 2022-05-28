import IResourceMeta from '@unblocked-web/specifications/agent/net/IResourceMeta';
import Resource from '../lib/Resource';
import Hero from '../index';
import MockConnectionToCore from './_MockConnectionToCore';

const sessionMeta = {
  tabId: 1,
  sessionId: 'session-id',
};

let testConnection: MockConnectionToCore;
beforeEach(() => {
  testConnection = new MockConnectionToCore(message => {
    const { command, messageId } = message;
    if (command === 'Core.createSession') {
      return { data: sessionMeta, responseId: messageId };
    } else if (command === 'Events.addEventListener') {
      return {
        data: { listenerId: 'listener-id' },
        responseId: messageId,
      };
    } else {
      return { data: {}, responseId: messageId };
    }
  });
});

function fakeEvent(eventType: string, listenerId: string, ...data: any[]): void {
  testConnection.fakeEvent({
    meta: sessionMeta,
    eventType,
    listenerId,
    data,
  });
}

describe('events', () => {
  it('receives close event', async () => {
    const hero = new Hero({ connectionToCore: testConnection });

    let isClosed = false;
    await hero.on('close', () => {
      isClosed = true;
    });
    testConnection.fakeEvent({
      meta: { sessionId: sessionMeta.sessionId },
      eventType: 'close',
      listenerId: 'listener-id',
      data: [],
    });
    await hero.close();

    const outgoingCommands = testConnection.outgoingSpy.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Events.addEventListener', // user added close listener
      'Session.close',
    ]);
    expect(isClosed).toBe(true);
  });

  it('adds and removes event listeners', async () => {
    let eventCount = 0;

    const hero = new Hero({ connectionToCore: testConnection });

    const onResourceFn = (resource): void => {
      expect(resource).toBeInstanceOf(Resource);
      eventCount += 1;
    };

    await hero.activeTab.on('resource', onResourceFn);

    fakeEvent('resource', 'listener-id', {
      id: 1,
    } as IResourceMeta);
    fakeEvent('resource', 'listener-id', {
      id: 2,
    } as IResourceMeta);

    // need to wait since events are handled on a promise resolution
    await new Promise(setImmediate);
    expect(eventCount).toBe(2);

    await hero.activeTab.off('resource', onResourceFn);

    fakeEvent('resource', 'listener-id', {
      id: 3,
    } as IResourceMeta);
    expect(eventCount).toBe(2);
  });
});
