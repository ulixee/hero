import IUnblockedPlugin, {
  UnblockedPluginClassDecorator,
} from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import Plugins from '../lib/Plugins';

test('each plugin should be given a chance to pre-configure the profile', () => {
  const plugin1Activate = jest.fn();

  @UnblockedPluginClassDecorator
  class Plugins1 {
    static id = 'Plugins1';
    static shouldActivate(profile: IEmulationProfile): boolean {
      plugin1Activate();
      profile.timezoneId = 'tz1';
      return true;
    }
  }
  const plugin2Activate = jest.fn();

  @UnblockedPluginClassDecorator
  class Plugins2 {
    static id = 'Plugins2';
    static shouldActivate(profile: IEmulationProfile): boolean {
      plugin2Activate();
      expect(profile.timezoneId).toBe('tz1');
      profile.timezoneId = 'tz2';
      return true;
    }
  }

  const plugin3Activate = jest.fn();
  // It should not include Pluginss that choose not to participate
  @UnblockedPluginClassDecorator
  class Plugins3 {
    static id = 'Plugins3';
    static shouldActivate(profile: IEmulationProfile): boolean {
      plugin3Activate();
      if (profile.timezoneId === 'tz2') return false;
    }
  }

  // It should include Pluginss that don't implement shouldActivate
  @UnblockedPluginClassDecorator
  class Plugins4 {
    static id = 'Plugins4';
  }

  const plugins = new Plugins({}, [Plugins1, Plugins2, Plugins3, Plugins4], {});

  expect(plugin1Activate).toHaveBeenCalled();
  expect(plugin2Activate).toHaveBeenCalled();
  expect(plugin3Activate).toHaveBeenCalled();
  expect(plugins.instances).toHaveLength(3);
  expect(plugins.instances.find(x => x instanceof Plugins4)).toBeTruthy();
});

test('should only allow take the last implementation of playInteractions', async () => {
  const play1Fn = jest.fn();

  @UnblockedPluginClassDecorator
  class Plugins1 {
    static id = 'Plugins1';
    playInteractions(): Promise<void> {
      play1Fn();
      return Promise.resolve();
    }
  }

  const play2Fn = jest.fn();
  @UnblockedPluginClassDecorator
  class Plugins2 {
    static id = 'Plugins2';
    playInteractions(): Promise<void> {
      play2Fn();
      return Promise.resolve();
    }
  }

  const plugins = new Plugins({}, [Plugins1, Plugins2], {});
  await plugins.playInteractions([], jest.fn(), null);
  expect(play1Fn).not.toHaveBeenCalled();
  expect(play2Fn).toHaveBeenCalledTimes(1);
});

test("plugin implementations should be called in the order they're installed", async () => {
  const newPage1Fn = jest.fn();

  const callOrder = [];
  @UnblockedPluginClassDecorator
  class Plugins1 {
    static id = 'Plugins1';
    onNewPage(): Promise<void> {
      newPage1Fn();
      callOrder.push(newPage1Fn);
      return Promise.resolve();
    }
  }
  const newPage2Fn = jest.fn();
  @UnblockedPluginClassDecorator
  class Plugins2 {
    static id = 'Plugins2';
    onNewPage(): Promise<void> {
      newPage2Fn();
      callOrder.push(newPage2Fn);
      return Promise.resolve();
    }
  }

  const plugins = new Plugins({}, [Plugins1, Plugins2], {});
  await plugins.onNewPage({} as any);
  expect(newPage1Fn).toHaveBeenCalledTimes(1);
  expect(newPage2Fn).toHaveBeenCalledTimes(1);
  expect(callOrder).toEqual([newPage1Fn, newPage2Fn]);
});

test('should pass config to correct plugin', async () => {
  const plugin1Config = { plugin1: true };
  const plugin2Config = { plugin2: true };

  @UnblockedPluginClassDecorator
  class Plugins1 {
    static id = 'Plugins1';

    constructor(_emulationProfile: IEmulationProfile, config?: typeof plugin1Config) {
      expect(config).toEqual(plugin1Config);
    }
  }

  @UnblockedPluginClassDecorator
  class Plugins2 implements IUnblockedPlugin {
    static id = 'Plugins2';

    constructor(emulationProfile: IEmulationProfile, config?: typeof plugin1Config) {
      expect(config).toEqual(plugin2Config);
    }
  }

  const _plugins = new Plugins({}, [Plugins1, Plugins2], {
    [Plugins1.id]: plugin1Config,
    [Plugins2.id]: plugin2Config,
  });
});

test('should disable plugin if config = false', async () => {  @UnblockedPluginClassDecorator
  class Plugins1 {
    static id = 'Plugins1';
  }

  class Plugins2 {
    static id = 'Plugins2';
  }

  const plugins = new Plugins({}, [Plugins1, Plugins2], {
    [Plugins1.id]: true,
    [Plugins2.id]: false,
  });

  expect(plugins.instances).toHaveLength(1);
});

test('should skip shouldEnabled if config = true', async () => {  
  const shouldActivate1 = jest.fn();
  const shouldActivate2 = jest.fn();
  
  @UnblockedPluginClassDecorator
  class Plugins1 {
    static id = 'Plugins1';

    static shouldActivate(): boolean {
      shouldActivate1();
      return false;
    }
  }

  @UnblockedPluginClassDecorator
  class Plugins2 {
    static id = 'Plugins2';

    static shouldActivate(): boolean {
      shouldActivate2();
      return false;
    }
  }

  const plugins = new Plugins({}, [Plugins1, Plugins2], {
    [Plugins1.id]: true,
    [Plugins2.id]: undefined,
  });

  expect(shouldActivate1).not.toHaveBeenCalled();
  expect(shouldActivate2).toHaveBeenCalled();
  expect(plugins.instances).toHaveLength(1);
});