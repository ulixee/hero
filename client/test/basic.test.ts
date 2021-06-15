import Core from '@secret-agent/core/index';
import ICoreRequestPayload from '@secret-agent/interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@secret-agent/interfaces/ICoreResponsePayload';
import { Helpers } from '@secret-agent/testing';
import { Agent, Handler } from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';
import { readCommandLineArgs } from '../lib/Input';

afterAll(Helpers.afterAll);

describe('basic SecretAgent tests', () => {
  it("doesn't connect until an agent is used for a pre-established connection", async () => {
    const outgoing = jest.fn<any, any>(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    class Empty extends ConnectionToCore {
      async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
        return outgoing(payload);
      }

      protected createConnection = () => Promise.resolve(null);
      protected destroyConnection = () => Promise.resolve(null);
    }

    const handler = new Handler(new Empty());
    await handler.close();

    expect(outgoing).toHaveBeenCalledTimes(0);
    expect(Object.keys(Core.connections)).toHaveLength(0);
  });

  it('creates and closes an agent', async () => {
    const outgoing = jest.fn(
      async ({ command }: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
        if (command === 'Session.create') {
          return {
            data: { tabId: 'tab-id', sessionId: 'session-id', sessionsDataLocation: '' },
          };
        }
      },
    );

    class Piper extends ConnectionToCore {
      async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
        const response = await outgoing(payload);
        this.onMessage({
          responseId: payload.messageId,
          data: response?.data ?? {},
          ...(response ?? {}),
        });
      }

      protected createConnection = () => Promise.resolve(null);
      protected destroyConnection = () => Promise.resolve(null);
    }
    const agent = await new Agent({ connectionToCore: new Piper() });
    await agent.close();

    const outgoingCommands = outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Session.create',
      'Session.close',
    ]);
  });

  it('can read command line args', async () => {
    process.argv[2] = '--input.city=Atlanta';
    process.argv[3] = '--input.state="GA"';
    process.argv[4] = '--input.address.number=9145';
    process.argv[5] = '--input.address.street="Street Street"';
    expect(readCommandLineArgs()).toEqual({
      city: 'Atlanta',
      state: 'GA',
      address: {
        number: '9145',
        street: 'Street Street',
      },
    });
  });
});
