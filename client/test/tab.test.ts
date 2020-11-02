// tslint:disable:variable-name
import { SecretAgentClientGenerator } from '../index';

describe('createBrowser tests', () => {
  it('starts, configures, and shuts down', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'createTab') {
        return {
          data: { tabId: 'tab-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const agent = await new SecretAgent();
    await agent.close();
    await SecretAgent.shutdown();

    const outgoingCommands = (coreClient.pipeOutgoingCommand as any).mock.calls;
    expect(outgoingCommands.map(c => c.slice(0, 2))).toMatchObject([
      [null, 'createTab'],
      [expect.any(Object), 'close'],
      [null, 'disconnect'],
    ]);
    expect(await agent.sessionId).toBe('session-id');
  });
});
