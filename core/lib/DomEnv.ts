import * as fs from 'fs';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import Log from '@secret-agent/commons/Logger';
import * as Typeson from 'typeson';
import * as TypesonRegistry from 'typeson-registry/dist/presets/builtin';
import IExecJsPathResult from '@secret-agent/core-interfaces/IExecJsPathResult';
import { IAttachedState } from '@secret-agent/core-interfaces/AwaitedDom';
import { IPuppetPage } from '@secret-agent/puppet-interfaces/IPuppetPage';
import injectedSourceUrl from '@secret-agent/core-interfaces/injectedSourceUrl';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IWindowOffset from '@secret-agent/core-interfaces/IWindowOffset';
import IElementRect from '@secret-agent/core-interfaces/IElementRect';
import IMouseUpResult from '@secret-agent/core-interfaces/IMouseUpResult';
import DomEnvError from './DomEnvError';
import { Serializable } from '../interfaces/ISerializable';

const { log } = Log(module);
const TSON = new Typeson().register(TypesonRegistry);
const SA_NOT_INSTALLED = 'SA_SCRIPT_NOT_INSTALLED';

const pageScripts = {
  typeson: fs.readFileSync(require.resolve('typeson/dist/typeson.min.js'), 'utf8'),
  typesonRegistry: fs
    .readFileSync(require.resolve('typeson-registry/dist/presets/builtin.js'), 'utf8')
    .replace(/\/\/# sourceMappingURL=.+\.map/g, ''),
  domStorage: fs.readFileSync(require.resolve(`../injected-scripts/domStorage.js`), 'utf8'),
  jsPath: fs.readFileSync(require.resolve(`../injected-scripts/jsPath.js`), 'utf8'),
  Fetcher: fs.readFileSync(require.resolve(`../injected-scripts/Fetcher.js`), 'utf8'),
  MouseEvents: fs.readFileSync(require.resolve(`../injected-scripts/MouseEvents.js`), 'utf8'),
};

const domEnvScript = `(function installDomEnv() {
const exports = {}; // workaround for ts adding an exports variable
${pageScripts.typeson};
${pageScripts.typesonRegistry};
const TSON = new Typeson().register(Typeson.presets.builtin);

${pageScripts.jsPath};
${pageScripts.Fetcher};
${pageScripts.MouseEvents};

window.SecretAgent = {
  JsPath,
  MouseEvents,
  Fetcher,
};

${pageScripts.domStorage}
})();`;

export default class DomEnv {
  private puppetPage: IPuppetPage;
  private isInstalled = false;
  private tab: { isClosing: boolean };
  private logger: IBoundLog;

  constructor(tab: { sessionId: string; isClosing: boolean; id: string }, puppetPage: IPuppetPage) {
    this.puppetPage = puppetPage;
    this.tab = tab;
    this.logger = log.createChild(module, {
      sessionId: tab.sessionId,
      tabId: tab.id,
    });
  }

  public async install() {
    if (this.isInstalled) return;
    this.isInstalled = true;
    await this.puppetPage.addNewDocumentScript(domEnvScript, true);
  }

  public execNonIsolatedExpression<T>(expression: string, propertiesToExtract?: string[]) {
    return this.runFn<{ value: T; type: string }>(
      'getJsValue',
      `(async function execNonIsolatedExpression() {
  const value = await ${expression};

  let type = typeof value;
  if (value && value.constructor) {
    type = value.constructor.name;
  }

  return JSON.stringify({
    value,
    type,
  });

})(${propertiesToExtract ?? [].join(',')});
//# sourceURL=${injectedSourceUrl}
`,
      false,
    );
  }

  public execJsPath<T>(jsPath: IJsPath, propertiesToExtract?: string[]) {
    return this.runIsolatedFn<IExecJsPathResult<T>>(
      'window.SecretAgent.JsPath.exec',
      jsPath,
      propertiesToExtract,
    );
  }

  public waitForElement(jsPath: IJsPath, waitForVisible: boolean, timeoutMillis: number) {
    return this.runIsolatedFn<IExecJsPathResult<boolean>>(
      'window.SecretAgent.JsPath.waitForElement',
      jsPath,
      waitForVisible,
      timeoutMillis,
    );
  }

  public isJsPathVisible(jsPath: IJsPath) {
    return this.runIsolatedFn<IExecJsPathResult<boolean>>(
      'window.SecretAgent.JsPath.isVisible',
      jsPath,
    );
  }

  public createFetchRequest(input: string | number, init?: IRequestInit) {
    return this.runIsolatedFn<IAttachedState>(
      'window.SecretAgent.Fetcher.createRequest',
      input,
      // @ts-ignore
      init,
    );
  }

  public execFetch(input: number | string, init?: IRequestInit) {
    // @ts-ignore
    return this.runIsolatedFn<IAttachedState>('window.SecretAgent.Fetcher.fetch', input, init);
  }

  public waitForScrollOffset(scrollX: number, scrollY: number, timeoutMillis = 2e3) {
    return this.runIsolatedFn<boolean>(
      'window.SecretAgent.JsPath.waitForScrollOffset',
      [scrollX, scrollY],
      timeoutMillis,
    );
  }

  public getJsPathClientRect(jsPath: IJsPath) {
    return this.runIsolatedFn<IElementRect>('window.SecretAgent.JsPath.getClientRect', jsPath);
  }

  public simulateOptionClick(jsPath: IJsPath) {
    return this.runIsolatedFn<boolean>('window.SecretAgent.JsPath.simulateOptionClick', jsPath);
  }

  public getWindowOffset() {
    return this.runIsolatedFn<IWindowOffset>('window.SecretAgent.JsPath.getWindowOffset');
  }

  public locationHref() {
    return this.puppetPage.mainFrame.evaluate<string>('location.href', false);
  }

  /////// MOUSE EVENTS /////////////////////////////////////////////////////////////////////////////////////////////////

  public registerMouseoverListener(nodeId: number): Promise<void> {
    return this.runIsolatedFn<void>(
      'window.SecretAgent.MouseEvents.listenFor',
      'mouseover',
      nodeId,
    );
  }

  public waitForMouseover(nodeId: number, timeoutMillis: number): Promise<boolean> {
    return this.runIsolatedFn<boolean>(
      'window.SecretAgent.MouseEvents.waitFor',
      'mouseover',
      nodeId,
      timeoutMillis,
    )
      .then(x => {
        if ((x as any) === 'timeout') {
          return false;
        }
        return x;
      })
      .catch(err => {
        throw err;
      });
  }

  public registerMouseupListener(nodeId: number): Promise<void> {
    return this.runIsolatedFn<void>('window.SecretAgent.MouseEvents.listenFor', 'mouseup', nodeId);
  }

  public waitForMouseup(nodeId: number, timeoutMillis: number): Promise<IMouseUpResult> {
    return this.runIsolatedFn<IMouseUpResult>(
      'window.SecretAgent.MouseEvents.waitFor',
      'mouseup',
      nodeId,
      timeoutMillis,
    )
      .then(x => {
        if ((x as any) === 'timeout') {
          return {
            didClickLocation: false,
          } as IMouseUpResult;
        }
        return x;
      })
      .catch(err => {
        throw err;
      });
  }

  private runIsolatedFn<T>(fnName: string, ...args: Serializable[]) {
    const callFn = `${fnName}(${args
      .map(x => {
        if (!x) return 'undefined';
        return JSON.stringify(x);
      })
      .join(', ')})`;
    const serializedFn = `'SecretAgent' in window ? ${callFn} : '${SA_NOT_INSTALLED}';`;
    return this.runFn<T>(fnName, serializedFn);
  }

  private async runFn<T>(
    fnName: string,
    serializedFn: string,
    runInIsolatedEnvironment = true,
    retries = 10,
  ): Promise<T> {
    const unparsedResult = await this.puppetPage.mainFrame.evaluate(
      serializedFn,
      runInIsolatedEnvironment,
    );

    if (unparsedResult === SA_NOT_INSTALLED) {
      if (retries === 0 || this.tab.isClosing) throw new Error('Injected scripts not installed.');
      this.logger.warn('Injected scripts not installed yet. Retrying', {
        fnName,
        frames: this.puppetPage.frames.map(x => ({
          id: x.id,
          parentId: x.parentId,
          url: x.url,
          name: x.name,
          navigationReason: x.navigationReason,
        })),
        frameId: this.puppetPage.mainFrame.id,
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.runFn<T>(fnName, serializedFn, runInIsolatedEnvironment, retries - 1);
    }

    const result = unparsedResult ? TSON.parse(unparsedResult) : unparsedResult;
    if (result?.error) {
      this.logger.error(fnName, { result });
      throw new DomEnvError(result.error, result.pathState);
    } else {
      return result as T;
    }
  }
}
