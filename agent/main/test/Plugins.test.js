"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const IUnblockedPlugin_1 = require("@ulixee/unblocked-specification/plugin/IUnblockedPlugin");
const Plugins_1 = require("../lib/Plugins");
test('each plugin should be given a chance to pre-configure the profile', () => {
    const plugin1Activate = jest.fn();
    let Plugins1 = class Plugins1 {
        static shouldActivate(profile) {
            plugin1Activate();
            profile.timezoneId = 'tz1';
            return true;
        }
    };
    Plugins1.id = 'Plugins1';
    Plugins1 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins1);
    const plugin2Activate = jest.fn();
    let Plugins2 = class Plugins2 {
        static shouldActivate(profile) {
            plugin2Activate();
            expect(profile.timezoneId).toBe('tz1');
            profile.timezoneId = 'tz2';
            return true;
        }
    };
    Plugins2.id = 'Plugins2';
    Plugins2 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins2);
    const plugin3Activate = jest.fn();
    // It should not include Pluginss that choose not to participate
    let Plugins3 = class Plugins3 {
        static shouldActivate(profile) {
            plugin3Activate();
            if (profile.timezoneId === 'tz2')
                return false;
        }
    };
    Plugins3.id = 'Plugins3';
    Plugins3 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins3);
    // It should include Pluginss that don't implement shouldActivate
    let Plugins4 = class Plugins4 {
    };
    Plugins4.id = 'Plugins4';
    Plugins4 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins4);
    const plugins = new Plugins_1.default({}, [Plugins1, Plugins2, Plugins3, Plugins4], {});
    expect(plugin1Activate).toHaveBeenCalled();
    expect(plugin2Activate).toHaveBeenCalled();
    expect(plugin3Activate).toHaveBeenCalled();
    expect(plugins.instances).toHaveLength(3);
    expect(plugins.instances.find(x => x instanceof Plugins4)).toBeTruthy();
});
test('should only allow take the last implementation of playInteractions', async () => {
    const play1Fn = jest.fn();
    let Plugins1 = class Plugins1 {
        playInteractions() {
            play1Fn();
            return Promise.resolve();
        }
    };
    Plugins1.id = 'Plugins1';
    Plugins1 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins1);
    const play2Fn = jest.fn();
    let Plugins2 = class Plugins2 {
        playInteractions() {
            play2Fn();
            return Promise.resolve();
        }
    };
    Plugins2.id = 'Plugins2';
    Plugins2 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins2);
    const plugins = new Plugins_1.default({}, [Plugins1, Plugins2], {});
    await plugins.playInteractions([], jest.fn(), null);
    expect(play1Fn).not.toHaveBeenCalled();
    expect(play2Fn).toHaveBeenCalledTimes(1);
});
test("plugin implementations should be called in the order they're installed", async () => {
    const newPage1Fn = jest.fn();
    const callOrder = [];
    let Plugins1 = class Plugins1 {
        onNewPage() {
            newPage1Fn();
            callOrder.push(newPage1Fn);
            return Promise.resolve();
        }
    };
    Plugins1.id = 'Plugins1';
    Plugins1 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins1);
    const newPage2Fn = jest.fn();
    let Plugins2 = class Plugins2 {
        onNewPage() {
            newPage2Fn();
            callOrder.push(newPage2Fn);
            return Promise.resolve();
        }
    };
    Plugins2.id = 'Plugins2';
    Plugins2 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins2);
    const plugins = new Plugins_1.default({}, [Plugins1, Plugins2], {});
    await plugins.onNewPage({});
    expect(newPage1Fn).toHaveBeenCalledTimes(1);
    expect(newPage2Fn).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual([newPage1Fn, newPage2Fn]);
});
test('should pass config to correct plugin', async () => {
    const plugin1Config = { plugin1: true };
    const plugin2Config = { plugin2: true };
    let Plugins1 = class Plugins1 {
        constructor(_emulationProfile, config) {
            expect(config).toEqual(plugin1Config);
        }
    };
    Plugins1.id = 'Plugins1';
    Plugins1 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins1);
    let Plugins2 = class Plugins2 {
        constructor(emulationProfile, config) {
            expect(config).toEqual(plugin2Config);
        }
    };
    Plugins2.id = 'Plugins2';
    Plugins2 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins2);
    const _plugins = new Plugins_1.default({}, [Plugins1, Plugins2], {
        [Plugins1.id]: plugin1Config,
        [Plugins2.id]: plugin2Config,
    });
});
test('should disable plugin if config = false', async () => {
    let Plugins1 = class Plugins1 {
    };
    Plugins1.id = 'Plugins1';
    Plugins1 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins1);
    class Plugins2 {
    }
    Plugins2.id = 'Plugins2';
    const plugins = new Plugins_1.default({}, [Plugins1, Plugins2], {
        [Plugins1.id]: true,
        [Plugins2.id]: false,
    });
    expect(plugins.instances).toHaveLength(1);
});
test('should skip shouldEnabled if config = true', async () => {
    const shouldActivate1 = jest.fn();
    const shouldActivate2 = jest.fn();
    let Plugins1 = class Plugins1 {
        static shouldActivate() {
            shouldActivate1();
            return false;
        }
    };
    Plugins1.id = 'Plugins1';
    Plugins1 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins1);
    let Plugins2 = class Plugins2 {
        static shouldActivate() {
            shouldActivate2();
            return false;
        }
    };
    Plugins2.id = 'Plugins2';
    Plugins2 = __decorate([
        IUnblockedPlugin_1.UnblockedPluginClassDecorator
    ], Plugins2);
    const plugins = new Plugins_1.default({}, [Plugins1, Plugins2], {
        [Plugins1.id]: true,
        [Plugins2.id]: undefined,
    });
    expect(shouldActivate1).not.toHaveBeenCalled();
    expect(shouldActivate2).toHaveBeenCalled();
    expect(plugins.instances).toHaveLength(1);
});
//# sourceMappingURL=Plugins.test.js.map