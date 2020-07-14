// tslint:disable:variable-name
import { SecretAgentClientGenerator } from '../index';

describe('createBrowser tests', () => {
  it('starts, configures, and shuts down', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    const browser = await SecretAgent.createBrowser();
    await browser.close();
    await SecretAgent.shutdown();

    const outgoingCommands = (coreClient.pipeOutgoingCommand as any).mock.calls;
    expect(outgoingCommands.map(c => c.slice(0, 2))).toMatchObject([
      [null, 'createSession'],
      [expect.any(Object), 'close'],
      [null, 'closeSessions'],
    ]);
    expect(browser.sessionId).toBe('session-id');
  });
});
