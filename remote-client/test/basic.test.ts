import RemoteClient from '../index';

describe('basic RemoteClient tests', () => {
  it('should goto and waitForLocation', async () => {
    const remoteClient = new RemoteClient();
    const { SecretAgent } = remoteClient;
    const payloads = [];

    let commandId = 0;
    remoteClient.pipeOutgoing(payload => {
      payloads.push(payload);
      commandId += 1;
      if (payload.command === 'createTab') {
        const data = { sessionId: 'session-id', tabId: 'tab-id' };
        remoteClient.pipeIncoming({ responseId: payload.messageId, commandId, data });
      } else {
        remoteClient.pipeIncoming({ responseId: payload.messageId, commandId, data: {} });
      }
    });

    const agent = await new SecretAgent();
    const sessionId = await agent.sessionId;
    await agent.goto('http://example.org');
    await agent.close();

    expect(sessionId).toBe('session-id');
    expect(payloads.map(p => p.command)).toMatchObject(['createTab', 'goto', 'close']);
  });
});
