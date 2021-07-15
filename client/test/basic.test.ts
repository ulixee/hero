import Core from '@ulixee/hero-core/index';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import { Helpers } from '@ulixee/testing';
import { Hero, Handler } from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';
import { readCommandLineArgs } from '../lib/Input';

afterAll(Helpers.afterAll);

describe('basic Hero tests', () => {
  it("doesn't connect until an hero is used for a pre-established connection", async () => {
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

  it('creates and closes an hero', async () => {
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
    const hero = await new Hero({ connectionToCore: new Piper() });
    await hero.close();

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
