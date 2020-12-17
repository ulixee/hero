import { Helpers } from '@secret-agent/testing';
import agent, { Agent, Handler } from '@secret-agent/client';
import * as http from 'http';
import RemoteServer from '../lib/RemoteServer';

let httpServer: Helpers.ITestHttpServer<http.Server>;
let remoteServer: RemoteServer;

beforeAll(async () => {
  httpServer = await Helpers.runHttpServer({ onlyCloseOnFinal: true });
  remoteServer = new RemoteServer();
  Helpers.onClose(() => remoteServer.close(), true);
  await remoteServer.listen({ port: 0, host: '127.0.0.1' });
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic remote connection tests', () => {
  it('should goto and waitForLocation', async () => {
    // bind a core server to core

    const handler = new Handler({
      host: `127.0.0.1:${remoteServer.port}`,
    });
    const handlerAgent = await handler.createAgent();
    const sessionId = await handlerAgent.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await handlerAgent.goto(url);

    const html = await handlerAgent.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await handlerAgent.close();
    await handler.close();
  });

  it('should be able to set a remote connection on the default agent', async () => {
    // bind a core server to core
    await agent.configure({
      coreConnection: {
        host: `127.0.0.1:${remoteServer.port}`,
      },
    });
    const sessionId = await agent.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await agent.goto(url);

    const html = await agent.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await agent.close();
  });

  it('should be able to configure a new agent', async () => {
    // bind a core server to core
    const customAgent = new Agent({
      coreConnection: {
        host: `127.0.0.1:${remoteServer.port}`,
      },
    });
    const sessionId = await customAgent.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await customAgent.goto(url);

    const html = await customAgent.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await customAgent.close();
  });
});
