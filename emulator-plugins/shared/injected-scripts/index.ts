import * as fs from 'fs';
import IPageOverride from '@secret-agent/emulators/interfaces/IPageOverride';
import injectedSourceUrl from '@secret-agent/core-interfaces/injectedSourceUrl';

const cache: { [name: string]: string } = {};
const shouldCache = process.env.NODE_ENV === 'production';

const utilsScript = fs.readFileSync(`${__dirname}/utils.js`, 'utf8');

export default class InjectedScripts {
  private readonly scripts: string[] = [];

  public build(): IPageOverride[] {
    return [
      {
        // NOTE: don't make this async. It can cause issues if you read a frame right after creation, for instance
        script: `(function newDocumentScript() {
  const sourceUrl = '${injectedSourceUrl}';
  ${utilsScript}
  
  function runNewDocumentScript(){ 
    ${this.scripts.join('\n\n')}      
  }
  // if main frame and HTML element not loaded yet, give it a sec
  if (window.self === window.top && !document.documentElement) {
    new MutationObserver((list, observer) => {
      observer.disconnect();
      runNewDocumentScript();
    }).observe(document, {childList: true, subtree: true});
  } else {
    runNewDocumentScript();
  }
})();
//# sourceURL=${injectedSourceUrl}`.replace(/\/\/# sourceMap.+/g, ''),
      },
    ];
  }

  public add(name: string, args: any = {}) {
    let script = cache[name];
    if (!script) {
      script = fs.readFileSync(`${__dirname}/${name}.js`, 'utf8');
    }
    if (shouldCache) cache[name] = script;

    if (name === 'errors') args.sourceUrl = injectedSourceUrl;
    this.scripts.push(`(function newDocumentScript_${name}(args) {
  try {
    ${script};
  } catch(err) {
    console.log('Failed to initialize "${name}"', err);
  }
})(${JSON.stringify(args)});`);
  }
}

export function getOverrideScript(name: string, args?: any) {
  const injected = new InjectedScripts();
  injected.add(name, args);
  return injected.build()[0];
}
