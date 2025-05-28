"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectedSourceUrl = void 0;
exports.getOverrideScript = getOverrideScript;
const fs = require("fs");
const TypeSerializer_1 = require("@ulixee/commons/lib/TypeSerializer");
const injectedSourceUrl = `<anonymous-${Math.random()}>`;
exports.injectedSourceUrl = injectedSourceUrl;
const cache = {};
const shouldCache = process.env.NODE_ENV === 'production';
const utilsScript = [
    fs.readFileSync(`${__dirname}/../injected-scripts/_utils.js`, 'utf8'),
].join('\n');
class DomOverridesBuilder {
    constructor(config) {
        this.config = config;
        this.scriptsByName = new Map();
        this.alwaysPageScripts = new Set();
        this.alwaysWorkerScripts = new Set();
        this.workerOverrides = new Set();
    }
    getWorkerOverrides() {
        return [...this.workerOverrides];
    }
    build(type = 'page', scriptNames) {
        const scripts = new Map();
        const callbacks = [];
        for (const [name, script] of this.scriptsByName) {
            const shouldIncludeScript = scriptNames ? scriptNames.includes(name) : true;
            if (shouldIncludeScript) {
                scripts.set(name, script);
            }
        }
        if (type === 'page') {
            let counter = 0;
            for (const script of this.alwaysPageScripts) {
                if (script.callback)
                    callbacks.push(script.callback);
                if (script.script)
                    scripts.set(`alwaysPageScript${counter}`, script.script);
                counter += 1;
            }
        }
        else if (type.includes('worker')) {
            let counter = 0;
            for (const script of this.alwaysWorkerScripts) {
                if (script.callback)
                    callbacks.push(script.callback);
                if (script.script)
                    scripts.set(`alwaysWorkerScript${counter}`, script.script);
                counter += 1;
            }
        }
        const shouldNotRunInWorker = name => {
            if (name.startsWith('alwaysWorkerScript'))
                return false;
            return !this.workerOverrides.has(name);
        };
        const catchHandling = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
            ? ' console.error("ERROR in dom override script", e); '
            : '';
        return {
            callbacks,
            // NOTE: don't make this async. It can cause issues if you read a frame right after creation, for instance
            script: `
(function newDocumentScriptWrapper(scopedVars = {}) {
  const exports = {};
  const targetType = '${type}';
  // Worklet has no scope to override, but we can't detect until it loads
  if (typeof self === 'undefined' && typeof window === 'undefined') return;

  if (!scopedVars.runMap) scopedVars.runMap = new WeakSet();
  const runMap = scopedVars.runMap;

  if (runMap.has(self)) return;

  let callbackHere;
  try {
      callbackHere = callback;
  } catch {
      callbackHere = (...args) => {console.log('callback not defined, currently not supported in workers')};
  }

  ${TypeSerializer_1.stringifiedTypeSerializerClass};
  
  const utilsInput = {
    sourceUrl: '${injectedSourceUrl}',
    targetType: '${type}',
    callback: callbackHere,
  }
  const sourceUrl = '${injectedSourceUrl}';
  ${utilsScript.replaceAll('export function', 'function')};
  const utils = main(utilsInput);

  const baseScriptInput = {...utilsInput, utils, TypeSerializer};
  
  (function newDocumentScript(selfOverride) {
    const originalSelf = self;
    if (selfOverride) self = selfOverride;

    try {
      if (runMap.has(self)) return;
      runMap.add(self);
      const isWorker = !self.document && "WorkerGlobalScope" in self;

      ${[...scripts]
                .map(([name, script]) => {
                let snippet = '';
                if (shouldNotRunInWorker(name))
                    snippet += `if (!isWorker) {\n`;
                snippet += `try { ${script} } catch(e) {${catchHandling}}`;
                if (shouldNotRunInWorker(name))
                    snippet += '\n}';
                return snippet;
            })
                .join('\n\n')};

      PathToInstanceTracker.updateAllReferences();
    } finally {
      self = originalSelf;
      utils.getSharedStorage().ready = true;
    }
  })();
})();
//# sourceURL=${injectedSourceUrl}`.replace(/\/\/# sourceMap.+/g, ''),
        };
    }
    registerWorkerOverrides(...names) {
        for (const name of names)
            this.workerOverrides.add(name);
    }
    add(name, args = undefined, registerWorkerOverride = false) {
        let script = cache[name];
        if (!script) {
            if (!fs.existsSync(`${__dirname}/../injected-scripts/${name}.js`)) {
                throw new Error(`Browser-Emulator injected script doesn\`t exist: ${name}`);
            }
            script = fs.readFileSync(`${__dirname}/../injected-scripts/${name}.js`, 'utf8');
        }
        if (shouldCache)
            cache[name] = script;
        script = script
            .replaceAll('export function', 'function')
            .split('\n')
            .filter(line => !line.includes('export {'))
            .join('\n');
        let wrapper = this.wrapScript(name, script, args);
        if (name.startsWith('polyfill.')) {
            wrapper = `// if main frame and HTML element not loaded yet, give it a sec
  if (!document.documentElement) {
    new MutationObserver((list, observer) => {
      observer.disconnect();
      ${wrapper};
    }).observe(document, {childList: true, subtree: true});
  } else {
    ${wrapper};
  }

`;
        }
        this.scriptsByName.set(name, wrapper);
        if (registerWorkerOverride) {
            this.registerWorkerOverrides(name);
        }
    }
    addPageScript(script, args, callbackFn) {
        args ??= {};
        args.callbackName ??= `injectedCallback${this.alwaysPageScripts.size}`;
        const wrapped = this.wrapScript('customScript', script, args);
        this.alwaysPageScripts.add({
            script: wrapped,
            callback: {
                name: args.callbackName,
                fn: callbackFn,
            },
        });
    }
    addOverrideAndUseConfig(injectedScript, defaultConfig, opts) {
        if (!this.config)
            throw new Error('This method can only be used when creating domOverriderBuilder with a config');
        const scriptConfig = this.config[injectedScript];
        if (!scriptConfig)
            return;
        this.add(injectedScript, scriptConfig === true ? defaultConfig : scriptConfig, opts?.registerWorkerOverride ?? false);
    }
    cleanup() {
        this.alwaysPageScripts.clear();
        this.alwaysWorkerScripts.clear();
    }
    addWorkerScript(script, args = {}) {
        const wrapped = this.wrapScript('customScript', script, args);
        this.alwaysWorkerScripts.add({
            script: wrapped,
        });
    }
    wrapScript(name, script, args = {}) {
        const serialized = TypeSerializer_1.default.stringify(args);
        // JSON.stringify needed in script to make sure everything is escape correctly
        // as sending this over CDP already reverses some logic
        return `
try{
  (function newDocumentScript_${name.replace(/\./g, '__')}(args) {
    try {
      ${script};
      main({...baseScriptInput, args});
    } catch(err) {
      console.log('Failed to initialize "${name}"', err);
    }
  })(TypeSerializer.parse(JSON.stringify(${serialized})));
  } catch (error){
    console.log(error)
  }`;
    }
}
exports.default = DomOverridesBuilder;
function getOverrideScript(name, args) {
    const injected = new DomOverridesBuilder();
    injected.add(name, args);
    return injected.build('page');
}
//# sourceMappingURL=DomOverridesBuilder.js.map