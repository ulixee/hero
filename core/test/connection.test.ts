import { Hero, Helpers } from '@ulixee/hero-testing';
import { Log } from '@ulixee/commons/lib/Logger';
import DefaultBrowserEmulator from '@unblocked-web/default-browser-emulator';
import { DependenciesMissingError } from '@ulixee/chrome-app/lib/DependenciesMissingError';
import ChromeApp from '@ulixee/chrome-app/index';
import BrowserEngine from '@unblocked-web/default-browser-emulator/lib/BrowserEngine';
import Core from '..';

const validate = jest.spyOn(BrowserEngine.prototype, 'verifyLaunchable');
const logError = jest.spyOn(Log.prototype, 'error');

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic connection tests', () => {
  it('should throw an error informing how to install dependencies', async () => {
    class CustomEmulator extends DefaultBrowserEmulator {
      public static id = 'emulate-test';
      public override onNewBrowser() {
        // don't change launch args so it doesn't reuse a previous one
      }
    }
    Core.defaultUnblockedPlugins = [CustomEmulator];

    logError.mockClear();
    validate.mockClear();
    validate.mockRejectedValueOnce(
      new DependenciesMissingError(
        `You can resolve this by running the apt dependency installer at:${ChromeApp.aptScriptPath}`,
        'Chrome',
        ['libnacl'],
      ),
    );

    logError.mockImplementationOnce(() => null /* no op*/);

    const hero1 = new Hero();
    Helpers.needsClosing.push(hero1);

    await expect(hero1).rejects.toThrowError(
      'Ulixee Server failed to launch Chrome',
    );
    expect(logError).toHaveBeenCalledTimes(1);
    const error = String((logError.mock.calls[0][1] as any).error);
    expect(error).toMatch('BrowserLaunchError');
    expect(error).toMatch('You can resolve this by running');
    expect(validate).toHaveBeenCalledTimes(1);
  });
});
