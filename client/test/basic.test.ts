import { SecretAgentClientGenerator } from '../index';

describe('basic SecretAgent tests', () => {
  it('starts, configures, and shuts down', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await SecretAgent.start();
    await SecretAgent.configure({});
    await SecretAgent.shutdown();

    const outgoingCommands = (coreClient.pipeOutgoingCommand as any).mock.calls;
    expect(outgoingCommands.map(c => c.slice(0, 2))).toMatchObject([
      [null, 'start'],
      [null, 'configure'],
      // no shutdown call if no browsers created
    ]);
  });

  it('opens a browser', async () => {
    const { SecretAgent, coreClient } = SecretAgentClientGenerator();

    coreClient.pipeOutgoingCommand = jest.fn<any, any>(async (_, command: string) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (command === 'createSession') {
        return {
          data: { windowId: 'window-id', sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    });

    await SecretAgent.createBrowser();
    await SecretAgent.shutdown();

    const outgoingCommands = (coreClient.pipeOutgoingCommand as any).mock.calls;
    expect(outgoingCommands.map(c => c.slice(0, 2))).toMatchObject([
      [null, 'createSession'],
      [null, 'closeSessions'],
    ]);
  });
});
