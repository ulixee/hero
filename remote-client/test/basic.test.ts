import RemoteClient from '@secret-agent/remote-client';

describe('basic browser remote tests', () => {
  it('should goto and waitForLocation', async () => {
    const remoteClient = new RemoteClient();
    const { SecretAgent } = remoteClient;
    const payloads = [];

    let commandId = 0;
    remoteClient.pipeOutgoing(payload => {
      payloads.push(payload);
      commandId += 1;
      if (payload.command === 'createSession') {
        const data = { sessionId: 'session-id', windowId: 'window-id' };
        remoteClient.pipeIncoming({ responseId: payload.messageId, commandId, data });
      } else {
        remoteClient.pipeIncoming({ responseId: payload.messageId, commandId, data: {} });
      }
    });

    const browser = await SecretAgent.createBrowser();
    const sessionId = browser.sessionId;
    await browser.goto('http://example.org');
    await browser.close();

    expect(sessionId).toBe('session-id');
    expect(payloads.map(p => p.command)).toMatchObject(['createSession', 'goto', 'close']);
  });
});
