import Core from '@secret-agent/core/index';
import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@secret-agent/core-interfaces/ICoreResponsePayload';
import { Agent, Handler } from '../index';
import CoreClientConnection from '../connections/CoreClientConnection';

describe('basic SecretAgent tests', () => {
  it("doesn't connect until an agent is used for a pre-established connection", async () => {
    const outgoing = jest.fn<any, any>(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    class Empty extends CoreClientConnection {
      async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
        return outgoing(payload);
      }
    }

    const handler = new Handler(new Empty());
    await handler.close();

    expect(outgoing).toHaveBeenCalledTimes(0);
    expect(Object.keys(Core.connections)).toHaveLength(0);
  });

  it('creates and closes an agent', async () => {
    const outgoing = jest.fn(
      async ({ command }: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
        if (command === 'createSession') {
          return {
            data: { tabId: 'tab-id', sessionId: 'session-id', sessionsDataLocation: '' },
          };
        }
      },
    );

    class Piper extends CoreClientConnection {
      async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
        const response = await outgoing(payload);
        this.onMessage({
          responseId: payload.messageId,
          data: response?.data ?? {},
          ...(response ?? {}),
        });
      }
    }
    const agent = new Agent({ coreConnection: new Piper() });
    await agent.close();

    const outgoingCommands = outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'connect',
      'createSession',
      'closeSession',
    ]);
  });
});
