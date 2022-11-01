import { UnblockedPluginClassDecorator } from '@ulixee/unblocked-specification/plugin/IUnblockedPlugin';
import IEmulationProfile from '@ulixee/unblocked-specification/plugin/IEmulationProfile';
import Plugins from '../lib/Plugins';

test('each plugin should be given a chance to pre-configure the profile', () => {
  const plugin1Activate = jest.fn();

  @UnblockedPluginClassDecorator
  class Plugins1 {
    static shouldActivate(profile: IEmulationProfile): boolean {
      plugin1Activate();
      profile.timezoneId = 'tz1';
      return true;
    }
  }
  const plugin2Activate = jest.fn();

  @UnblockedPluginClassDecorator
  class Plugins2 {
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
    static shouldActivate(profile: IEmulationProfile): boolean {
      plugin3Activate();
      if (profile.timezoneId === 'tz2') return false;
    }
  }

  // It should include Pluginss that don't implement shouldActivate
  @UnblockedPluginClassDecorator
  class Plugins4 {}

  const plugins = new Plugins({}, [Plugins1, Plugins2, Plugins3, Plugins4]);

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
    playInteractions(): Promise<void> {
      play1Fn();
      return Promise.resolve();
    }
  }

  const play2Fn = jest.fn();
  @UnblockedPluginClassDecorator
  class Plugins2 {
    playInteractions(): Promise<void> {
      play2Fn();
      return Promise.resolve();
    }
  }

  const plugins = new Plugins({}, [Plugins1, Plugins2]);
  await plugins.playInteractions([], jest.fn(), null);
  expect(play1Fn).not.toBeCalled();
  expect(play2Fn).toBeCalledTimes(1);
});

test("plugin implementations should be called in the order they're installed", async () => {
  const newPage1Fn = jest.fn();

  const callOrder = [];
  @UnblockedPluginClassDecorator
  class Plugins1 {
    onNewPage(): Promise<void> {
      newPage1Fn();
      callOrder.push(newPage1Fn);
      return Promise.resolve();
    }
  }
  const newPage2Fn = jest.fn();
  @UnblockedPluginClassDecorator
  class Plugins2 {
    onNewPage(): Promise<void> {
      newPage2Fn();
      callOrder.push(newPage2Fn);
      return Promise.resolve();
    }
  }

  const plugins = new Plugins({}, [Plugins1, Plugins2]);
  await plugins.onNewPage({} as any);
  expect(newPage1Fn).toBeCalledTimes(1);
  expect(newPage2Fn).toBeCalledTimes(1);
  expect(callOrder).toEqual([newPage1Fn, newPage2Fn]);
});
