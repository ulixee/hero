import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import { Helpers } from '@ulixee/testing';
import Hero from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';

afterAll(Helpers.afterAll);

describe('basic Hero tests', () => {
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
});
