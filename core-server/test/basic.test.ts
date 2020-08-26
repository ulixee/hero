import RemoteClient from '@secret-agent/remote-client';
import { Helpers } from '@secret-agent/testing';
import CoreServer from '../index';

let httpServer;

beforeAll(async () => {
  httpServer = await Helpers.runHttpServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic browser remote tests', () => {
  it('should goto and waitForLocation', async () => {
    const coreServer = new CoreServer();
    const coreConnection = coreServer.addConnection('test');
    const remoteClient = new RemoteClient();
    const { SecretAgent } = remoteClient;

    coreConnection.pipeOutgoing(p => remoteClient.pipeIncoming(p));
    remoteClient.pipeOutgoing(p => coreConnection.pipeIncoming(p));

    const browser = await SecretAgent.createBrowser();
    const sessionId = browser.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await browser.goto(url);

    const html = await browser.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await browser.close();
    await SecretAgent.shutdown();
  }, 10e3);
});
