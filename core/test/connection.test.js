"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const default_browser_emulator_1 = require("@ulixee/default-browser-emulator");
const DependenciesMissingError_1 = require("@ulixee/chrome-app/lib/DependenciesMissingError");
const index_1 = require("@ulixee/chrome-app/index");
const BrowserEngine_1 = require("@ulixee/default-browser-emulator/lib/BrowserEngine");
const __1 = require("..");
const validate = jest.spyOn(BrowserEngine_1.default.prototype, 'verifyLaunchable');
// TODO figure out why monorepo broke logging magic, and test if it doesnt
// break external logic. (Probably due to the way we change proto dynamically
// and import order now changed
const { log } = (0, Logger_1.default)(module);
const logError = jest.spyOn(Object.getPrototypeOf(log), 'error');
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
describe('basic connection tests', () => {
    it('should throw an error informing how to install dependencies', async () => {
        class CustomEmulator extends default_browser_emulator_1.default {
            onNewBrowser() {
                // don't change launch args so it doesn't reuse a previous one
            }
        }
        CustomEmulator.id = 'emulate-test';
        __1.default.defaultUnblockedPlugins = [CustomEmulator];
        logError.mockClear();
        validate.mockClear();
        validate.mockRejectedValueOnce(new DependenciesMissingError_1.DependenciesMissingError(`You can resolve this by running the apt dependency installer at:${index_1.default.aptScriptPath}`, 'Chrome', ['libnacl']));
        logError.mockImplementationOnce(() => null /* no op*/);
        const hero1 = new hero_testing_1.Hero();
        hero_testing_1.Helpers.needsClosing.push(hero1);
        await expect(hero1.connect()).rejects.toThrow('Ulixee Cloud failed to launch Chrome');
        expect(logError).toHaveBeenCalledTimes(1);
        const error = String(logError.mock.calls[0][1].error);
        expect(error).toMatch('DependenciesMissingError');
        expect(error).toMatch('You can resolve this by running');
        expect(validate).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=connection.test.js.map