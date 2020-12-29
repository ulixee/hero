import { Helpers } from '@secret-agent/testing';
import { Handler } from '@secret-agent/client';
import * as http from 'http';
import RemoteServer from '../lib/RemoteServer';

let httpServer: Helpers.ITestHttpServer<http.Server>;

beforeAll(async () => {
  httpServer = await Helpers.runHttpServer();
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic remote connection tests', () => {
  it('should goto and waitForLocation', async () => {
    // bind a core server to core
    const coreServer = new RemoteServer();
    Helpers.needsClosing.push(coreServer);
    await coreServer.listen({ port: 0, host: '127.0.0.1' });

    const handler = new Handler({
      host: `127.0.0.1:${coreServer.port}`,
    });
    const agent = await handler.createAgent();
    const sessionId = await agent.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await agent.goto(url);

    const html = await agent.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await agent.close();
    await handler.close();
  }, 10e3);
});
