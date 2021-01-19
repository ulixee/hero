import { Helpers } from '@secret-agent/testing';
import agent, { Agent, Handler } from '@secret-agent/client';
import * as http from 'http';
import CoreServer from '../server';

let httpServer: Helpers.ITestHttpServer<http.Server>;
let coreServer: CoreServer;

beforeAll(async () => {
  httpServer = await Helpers.runHttpServer({ onlyCloseOnFinal: true });
  coreServer = new CoreServer();
  Helpers.onClose(() => coreServer.close(), true);
  await coreServer.listen({ port: 0 });
});
afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic connection tests', () => {
  it('should goto and waitForLocation', async () => {
    // bind a core server to core

    const handler = new Handler({
      host: await coreServer.address,
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

  it('should be able to set a new connection on the default agent', async () => {
    // bind a core server to core
    await agent.configure({
      connectionToCore: {
        host: await coreServer.address,
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
      connectionToCore: {
        host: await coreServer.address,
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
