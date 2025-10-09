"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const Fs = require("fs");
const Path = require("path");
const devtoolsPreferencesCallback = '_DevtoolsPreferencesCallback';
class DevtoolsPreferences {
    constructor(browserEngine) {
        (0, utils_1.bindFunctions)(this);
        let browserDir = browserEngine.executablePath.split(browserEngine.fullVersion).shift();
        if (Fs.lstatSync(browserDir).isFile()) {
            browserDir = Path.dirname(browserDir);
        }
        this.preferencesPath = Path.join(browserDir, `devtoolsPreferences.json`);
    }
    installOnConnect(session) {
        session.on('Runtime.bindingCalled', event => this.onPreferenceAction(session, event));
        return Promise.all([
            session.send('Runtime.enable'),
            session.send('Runtime.addBinding', { name: devtoolsPreferencesCallback }),
            session.send('Page.enable'),
            session.send('Page.addScriptToEvaluateOnNewDocument', {
                source: `(function devtoolsPreferencesInterceptor() {
    const toIntercept = ['getPreferences', 'setPreference', 'removePreference', 'clearPreferences'].map(x => {
      return JSON.stringify({ method: x }).replace('{','').replace('}','').trim();
    });

    let inspector;
    Object.defineProperty(window, 'InspectorFrontendHost', {
      configurable: true,
      enumerable: true,
      get() { return inspector; },
      set(v) {
         inspector = v;
         // devtoolsHost is initiated when Inspector is created
         window.DevToolsHost.sendMessageToEmbedder = new Proxy(window.DevToolsHost.sendMessageToEmbedder, {
          apply(target, thisArg, args) {
            const json = args[0];
            for (const method of toIntercept) {
              if (json.includes(toIntercept)) {
                return window.${devtoolsPreferencesCallback}(json);
              }
            }
            return Reflect.apply(...arguments);
          }
         });
      },
    });
})()`,
            }),
            session.send('Runtime.runIfWaitingForDebugger'),
        ]).catch(() => null);
    }
    async onPreferenceAction(session, event) {
        if (event.name !== devtoolsPreferencesCallback)
            return;
        const { id, method, params } = JSON.parse(event.payload);
        await this.load();
        let result;
        if (method === 'getPreferences') {
            result = this.cachedPreferences;
        }
        else {
            if (method === 'setPreference') {
                this.cachedPreferences[params[0]] = params[1];
            }
            else if (method === 'removePreference') {
                delete this.cachedPreferences[params[0]];
            }
            else if (method === 'clearPreferences') {
                this.cachedPreferences = {};
            }
            await this.save();
        }
        await session
            .send('Runtime.evaluate', {
            // built-in devtools function/api
            expression: `window.DevToolsAPI.embedderMessageAck(${id}, ${JSON.stringify(result)})`,
            contextId: event.executionContextId,
        })
            .catch(() => null);
    }
    async save() {
        await Fs.promises.writeFile(this.preferencesPath, JSON.stringify(this.cachedPreferences, null, 2), 'utf8');
    }
    async load() {
        if (this.cachedPreferences === undefined) {
            try {
                this.cachedPreferences = await (0, fileUtils_1.readFileAsJson)(this.preferencesPath);
            }
            catch (e) {
                this.cachedPreferences = {};
            }
        }
    }
}
exports.default = DevtoolsPreferences;
//# sourceMappingURL=DevtoolsPreferences.js.map