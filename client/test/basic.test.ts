import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import { Helpers } from '@ulixee/hero-testing';
import Hero from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';
import { scriptInstance } from '../lib/Hero';

afterAll(Helpers.afterAll);

class MockedConnectionToCore extends ConnectionToCore {
  public outgoing = jest.fn(async (payload: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
    const { command } = payload;
    if (command === 'Core.createSession') {
      return {
        data: { tabId: 'tab-id', sessionId: 'session-id' },
      };
    }
  });

  async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    const response = await this.outgoing(payload);
    this.onMessage({
      responseId: payload.messageId,
      data: response?.data ?? {},
      ...(response ?? {}),
    });
  }

  protected createConnection = () => Promise.resolve(null);
  protected destroyConnection = () => Promise.resolve(null);
}

describe('basic Hero tests', () => {
  it('creates and closes a hero', async () => {
    const connectionToCore = new MockedConnectionToCore();
    const hero = await new Hero({ connectionToCore });
    await hero.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Session.close',
    ]);
  });

  it('emits commandId events', async () => {
    const connectionToCore = new MockedConnectionToCore();
    const hero = await new Hero({ connectionToCore });
    const events = [];

    void hero.on('command', (command, commandId, args) => {
      events.push({ command, commandId, args });
    });

    await hero.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Session.close',
    ]);

    expect(events).toMatchObject([
      {
        command: 'Session.close',
        commandId: 1,
        args: [false],
      },
    ]);
  });

  it('includes callsites during non-production mode', async () => {
    const connectionToCore = new MockedConnectionToCore();
    const hero = await new Hero({ connectionToCore });
    await hero.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;

    // Core.connect doesn't run over a command queue, so never gets callsites
    expect(outgoingCommands.filter(c => c[0].callsite)).toHaveLength(2);
  });

  it('does not include callsites during non-production mode', async () => {
    const connectionToCore = new MockedConnectionToCore();
    const hero = await new Hero({ connectionToCore, mode: 'production' });
    await hero.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;

    expect(outgoingCommands.filter(c => c[0].callsite)).toHaveLength(0)
  });
});

describe('ScriptInstance tests', () => {
  it('should be able to properly get a script location', () => {
    expect(scriptInstance.getScriptCallSite().split(/\r?\n/)).toHaveLength(1);

    (function testNested() {
      expect(scriptInstance.getScriptCallSite().split(/\r?\n/)).toHaveLength(2);
    })();
  });
});
