import { Helpers } from '@ulixee/testing';
import hero, { Hero, Handler } from '@ulixee/hero';
import * as http from 'http';
import { Log } from '@ulixee/commons/Logger';
import BrowserEmulator from '@ulixee/default-browser-emulator';
import { DependenciesMissingError } from '@ulixee/chrome-app/lib/DependenciesMissingError';
import { DependencyInstaller } from '@ulixee/chrome-app/lib/DependencyInstaller';
import ChromeApp from '@ulixee/chrome-app/index';
import Core from '../index';
import CoreServer from '../server';

const validate = jest.spyOn(DependencyInstaller.prototype, 'validate');
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
    const handlerHero = await handler.createHero();
    const sessionId = await handlerHero.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await handlerHero.goto(url);

    const html = await handlerHero.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await handlerHero.close();
    await handler.close();
  });

  it('should be able to set a new connection on the default hero', async () => {
    // bind a core server to core
    await hero.configure({
      connectionToCore: {
        host: await coreServer.address,
      },
    });
    const sessionId = await hero.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await hero.goto(url);

    const html = await hero.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await hero.close();
  });

  it('should be able to configure a new hero', async () => {
    // bind a core server to core
    const customHero = new Hero({
      connectionToCore: {
        host: await coreServer.address,
      },
    });
    const sessionId = await customHero.sessionId;
    expect(sessionId).toBeTruthy();

    const { url } = httpServer;
    await customHero.goto(url);

    const html = await customHero.document.documentElement.outerHTML;
    expect(html).toBe('<html><head></head><body>Hello world</body></html>');

    await customHero.close();
  });

  it('should throw an error informing how to install dependencies', async () => {
    class CustomEmulator extends BrowserEmulator {
      public static id = 'emulate-test';
      public static selectBrowserMeta() {
        return super.selectBrowserMeta();
      }

      public static onBrowserWillLaunch() {
        // don't change launch args so it doesn't reuse a previous one
      }
    }
    Core.use(CustomEmulator as any);

    logError.mockClear();
    validate.mockClear();
    validate.mockImplementationOnce(() => {
      throw new DependenciesMissingError(
        `You can resolve this by running the apt dependency installer at:${ChromeApp.aptScriptPath}`,
        'Chrome',
        ['libnacl'],
      );
    });

    logError.mockImplementationOnce(() => null /* no op*/);

    const hero1 = new Hero({
      browserEmulatorId: 'emulate-test',
      connectionToCore: {
        host: await coreServer.address,
      },
    });
    Helpers.needsClosing.push(hero1);

    try {
      await hero1;
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
  });
});
