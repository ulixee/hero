import * as fs from 'fs';
import { IFrame } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import INewDocumentInjectedScript from '../interfaces/INewDocumentInjectedScript';

const injectedSourceUrl = '<anonymuos>';
const cache: { [name: string]: string } = {};
const shouldCache = process.env.NODE_ENV === 'production';

const utilsScript = [
  fs.readFileSync(`${__dirname}/../injected-scripts/_proxyUtils.js`, 'utf8'),
  fs.readFileSync(`${__dirname}/../injected-scripts/_descriptorBuilder.js`, 'utf8'),
].join('\n');

export { injectedSourceUrl };

export default class DomOverridesBuilder {
  private readonly scriptsByName = new Map<string, string>();
  private readonly alwaysPageScripts = new Set<INewDocumentInjectedScript>();
  private readonly alwaysWorkerScripts = new Set<INewDocumentInjectedScript>();

  private workerOverrides = new Set<string>();

  public getWorkerOverrides(): string[] {
    return [...this.workerOverrides];
  }

  public build(
    type: 'worker' | 'page' = 'page',
    scriptNames?: string[],
  ): {
    script: string;
    callbacks: INewDocumentInjectedScript['callback'][];
  } {
    const scripts = new Map<string, string>();
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
        if (script.callback) callbacks.push(script.callback);
        if (script.script) scripts.set(`alwaysPageScript${counter}`, script.script);
        counter += 1;
      }
    } else if (type === 'worker') {
      let counter = 0;
      for (const script of this.alwaysWorkerScripts) {
        if (script.callback) callbacks.push(script.callback);
        if (script.script) scripts.set(`alwaysWorkerScript${counter}`, script.script);
        counter += 1;
      }
    }

    const shouldNotRunInWorker: (name: string) => boolean = name => {
      if (name.startsWith('alwaysWorkerScript')) return false;
      return !this.workerOverrides.has(name);
    };

    const catchHandling =
      process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
        ? ' console.error("ERROR in dom override script", e); '
        : '';
    return {
      callbacks,
      // NOTE: don't make this async. It can cause issues if you read a frame right after creation, for instance
      script: `(function newDocumentScriptWrapper() {
// Worklet has no scope to override, but we can't detect until it loads
if (typeof self === 'undefined' && typeof window === 'undefined') return;

runMap = typeof runMap === 'undefined' ? new WeakSet() : runMap;
if (runMap.has(self)) return;
  
const sourceUrl = '${injectedSourceUrl}';
${utilsScript}

(function newDocumentScript(selfOverride) {
  if (selfOverride) self = selfOverride;
  
  if (runMap.has(self)) return;
  runMap.add(self);
  const isWorker = !self.document && "WorkerGlobalScope" in self;
  
  ${[...scripts]
    .map(([name, script]) => {
      let snippet = '';
      if (shouldNotRunInWorker(name)) snippet += `if (!isWorker) {\n`;
      snippet += `try { ${script} } catch(e) {${catchHandling}}`;
      if (shouldNotRunInWorker(name)) snippet += '\n}';
      return snippet;
    })
    .join('\n\n')}
})();

})();
//# sourceURL=${injectedSourceUrl}`.replace(/\/\/# sourceMap.+/g, ''),
    };
  }

  public registerWorkerOverrides(...names: string[]): void {
    for (const name of names) this.workerOverrides.add(name);
  }

  public add(name: string, args: any = {}): void {
    let script = cache[name];
    if (!script) {
      if (!fs.existsSync(`${__dirname}/../injected-scripts/${name}.js`)) {
        throw new Error(`Browser-Emulator injected script doesn\`t exist: ${name}`);
      }
      script = fs.readFileSync(`${__dirname}/../injected-scripts/${name}.js`, 'utf8');
    }
    if (shouldCache) cache[name] = script;

    if (name === 'errors') args.sourceUrl = injectedSourceUrl;

    let wrapper = this.wrapScript(name, script, args);

    if (name.startsWith('polyfill.')) {
      wrapper = `// if main frame and HTML element not loaded yet, give it a sec
  if (!document.documentElement) {
    new MutationObserver((list, observer) => {
      observer.disconnect();
      ${wrapper}
    }).observe(document, {childList: true, subtree: true});
  } else {
    ${wrapper}
  }
`;
    }
    this.scriptsByName.set(name, wrapper);
  }

  public addPageScript(
    script: string,
    args: Record<string, any> & { callbackName?: string },
    callbackFn?: (data: string, frame: IFrame) => any,
  ): void {
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

  public cleanup(): void {
    this.alwaysPageScripts.clear();
    this.alwaysWorkerScripts.clear();
  }

  public addWorkerScript(script: string, args: any = {}): void {
    const wrapped = this.wrapScript('customScript', script, args);
    this.alwaysWorkerScripts.add({
      script: wrapped,
    });
  }

  private wrapScript(name: string, script: string, args: any = {}): string {
    return `(function newDocumentScript_${name.replace(/\./g, '__')}(args) {
  try {
    ${script};
  } catch(err) {
    console.log('Failed to initialize "${name}"', err);
  }
})(${JSON.stringify(args)});`;
  }
}

export function getOverrideScript(
  name: string,
  args?: any,
): { script: string; callbacks: INewDocumentInjectedScript['callback'][] } {
  const injected = new DomOverridesBuilder();
  injected.add(name, args);
  return injected.build('page');
}
