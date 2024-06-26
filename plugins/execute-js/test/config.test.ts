import { Helpers, Hero } from '@ulixee/hero-testing';
import Core from '@ulixee/hero-core';
import { CorePlugin } from '@ulixee/execute-js-plugin';
import ICorePluginCreateOptions from '@ulixee/hero-interfaces/ICorePluginCreateOptions';
import ICorePlugin, { ISessionSummary } from '@ulixee/hero-interfaces/ICorePlugin';
import type IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import type { PluginCustomConfig } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import { TransportBridge } from '@ulixee/net';
import { ConnectionToHeroCore } from '@ulixee/hero';

let core: Core;
let connectionToCore: ConnectionToHeroCore;
afterAll(Helpers.afterAll);
afterEach(async () => {
  await Helpers.afterEach();
  await core.close();
});

beforeEach(async () => {
  core = await Core.start();
  const bridge = new TransportBridge();
  core.addConnection(bridge.transportToClient);
  connectionToCore = new ConnectionToHeroCore(bridge.transportToCore);
});

test('it should receive a custom config', async () => {
  const testConfig = { test: 'testData' };
  const constructor = jest.fn();
  const shouldActivate = jest.fn();

  class TestingExecuteJsCorePlugin1 extends CorePlugin {
    static override id = 'TestingExecuteJsCorePlugin1';
    constructor(opts: ICorePluginCreateOptions) {
      super(opts);
      constructor(opts.customConfig);
    }

    static shouldActivate?(
      _emulationProfile: IEmulationProfile<unknown>,
      _sessionSummary: ISessionSummary,
      customConfig?: PluginCustomConfig,
    ): boolean {
      shouldActivate(customConfig);
      return true;
    }
  }

  core.use(TestingExecuteJsCorePlugin1);
  const hero = new Hero({
    connectionToCore,
    pluginConfigs: {
      [TestingExecuteJsCorePlugin1.id]: testConfig,
    },
  });

  Helpers.onClose(() => hero.close(), true);

  await hero.sessionId;
  expect(constructor).toHaveBeenCalledWith(testConfig);
  expect(shouldActivate).toHaveBeenCalledWith(testConfig);
  await hero.close();
});

test('it should not activate if config === false', async () => {
  const constructor = jest.fn();
  const shouldActivate = jest.fn();

  class TestingExecuteJsCorePlugin2 extends CorePlugin implements ICorePlugin {
    static override id = 'TestingExecuteJsCorePlugin2';
    constructor(opts: ICorePluginCreateOptions) {
      super(opts);
      constructor();
    }

    static shouldActivate(): boolean {
      shouldActivate();
      return true;
    }
  }
  core.use(TestingExecuteJsCorePlugin2);

  const hero = new Hero({
    pluginConfigs: {
      [TestingExecuteJsCorePlugin2.id]: false,
    },
  });
  Helpers.onClose(() => hero.close(), true);

  await hero.sessionId;
  expect(shouldActivate).not.toHaveBeenCalled();
  expect(constructor).not.toHaveBeenCalled();
  await hero.close();
});

test('it should skip shouldActivate if config === true', async () => {
  const constructor = jest.fn();
  const shouldActivate = jest.fn();

  class TestingExecuteJsCorePlugin3 extends CorePlugin implements ICorePlugin {
    static override id = 'TestingExecuteJsCorePlugin3';
    constructor(opts: ICorePluginCreateOptions) {
      super(opts);
      constructor();
    }

    static shouldActivate(): boolean {
      shouldActivate();
      return false;
    }
  }
  core.use(TestingExecuteJsCorePlugin3);

  const hero = new Hero({
    pluginConfigs: {
      [TestingExecuteJsCorePlugin3.id]: true,
    },
  });
  Helpers.onClose(() => hero.close(), true);

  await hero.sessionId;
  expect(shouldActivate).not.toHaveBeenCalled();
  expect(constructor).toHaveBeenCalled();
  await hero.close();
});
