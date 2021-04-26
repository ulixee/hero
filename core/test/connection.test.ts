import { Helpers } from '@secret-agent/testing';
import agent, { Agent, Handler } from '@secret-agent/client';
import * as http from 'http';
import { DependenciesMissingError } from '@secret-agent/puppet/lib/DependenciesMissingError';
import DependencyInstaller from '@secret-agent/puppet/lib/DependencyInstaller';
import * as ValidateHostDeps from '@secret-agent/puppet/lib/validateHostDependencies';
import { Log } from '@secret-agent/commons/Logger';
import CoreServer from '../server';

const validate = jest.spyOn(ValidateHostDeps, 'validateHostRequirements');
const logError = jest.spyOn(Log.prototype, 'error');

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

  it('should throw an error informing how to install dependencies', async () => {
    logError.mockClear();
    validate.mockClear();
    validate.mockImplementationOnce(() => {
      throw new DependenciesMissingError(
        `You can resolve this by running the apt dependency installer at:${DependencyInstaller.aptScriptPath}`,
        'Chrome',
        ['libnacl'],
      );
    });

    logError.mockImplementationOnce(() => null /* no op*/);

    const agent1 = new Agent({
      browserEmulatorId: 'chrome-latest',
      connectionToCore: {
        host: await coreServer.address,
      },
    });

    try {
      await agent1;
    } catch (err) {
      // eslint-disable-next-line jest/no-try-expect
      expect(String(err)).toMatch(
        'CoreServer needs further setup to launch the browserEmulator. See server logs',
      );
    }

    expect(logError).toHaveBeenCalledTimes(1);
    const error = String((logError.mock.calls[0][1] as any).error);
    expect(error).toMatch('PuppetLaunchError');
    expect(error).toMatch('You can resolve this by running');
    expect(validate).toHaveBeenCalledTimes(1);
    await agent1.close();
  });
});
