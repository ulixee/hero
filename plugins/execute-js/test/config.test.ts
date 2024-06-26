import { Helpers, Hero } from '@ulixee/hero-testing';
import Core from '@ulixee/hero-core';
import { CorePlugin } from '@ulixee/execute-js-plugin';
import ICorePluginCreateOptions from '@ulixee/hero-interfaces/ICorePluginCreateOptions';
import ICorePlugin, { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import type IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import type { PluginCustomConfig } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('it should receive a custom config', async () => {
  const testConfig = { test: 'testData' };
  class TestingExecuteJsCorePlugin extends CorePlugin {
    constructor(opts: ICorePluginCreateOptions) {
      super(opts);
      expect(opts.customConfig).toEqual(testConfig);
    }

    shouldActivate?(
      _emulationProfile: IEmulationProfile<unknown>,
      _sessionSummary: ISessionSummary,
      customConfig?: PluginCustomConfig,
    ): boolean {
      expect(customConfig).toEqual(testConfig);
      return true;
    }
  }
  Core.use(TestingExecuteJsCorePlugin);

  const hero = new Hero({
    pluginConfigs: {
      [TestingExecuteJsCorePlugin.id]: testConfig,
    },
  });
  Helpers.onClose(() => hero.close(), true);

  await hero.sessionId;
  await hero.close();
});

test('it should not activate if config === false', async () => {
  const constructor = jest.fn();
  const shouldActivate = jest.fn();

  class TestingExecuteJsCorePlugin extends CorePlugin implements ICorePlugin {
    constructor(opts: ICorePluginCreateOptions) {
      super(opts);
      constructor();
    }

    shouldActivate?(
      _emulationProfile: IEmulationProfile<unknown>,
      _sessionSummary: ISessionSummary,
      _customConfig?: PluginCustomConfig,
    ): boolean {
      shouldActivate();
      return true;
    }
  }
  Core.use(TestingExecuteJsCorePlugin);

  const hero = new Hero({
    pluginConfigs: {
      [TestingExecuteJsCorePlugin.id]: false,
    },
  });
  Helpers.onClose(() => hero.close(), true);

  await hero.sessionId;
  await hero.close();

  expect(shouldActivate).not.toHaveBeenCalled();
  expect(constructor).not.toHaveBeenCalled();
});
