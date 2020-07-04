import * as fs from 'fs';
import IDevtoolsClient from '../interfaces/IDevtoolsClient';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { IMousePositionXY } from '@secret-agent/core-interfaces/IInteractions';
import { SerializableOrJSHandle } from 'puppeteer';
import FrameTracker from './FrameTracker';
import Log from '@secret-agent/commons/Logger';
import Typeson from 'typeson';
import TypesonRegistry from 'typeson-registry/dist/presets/builtin';
import IElementRect from '@secret-agent/injected-scripts/interfaces/IElementRect';
import IExecJsPathResult from '@secret-agent/injected-scripts/interfaces/IExecJsPathResult';
import IAttachedState from '@secret-agent/injected-scripts/interfaces/IAttachedStateCopy';

const { log } = Log(module);
const TSON = new Typeson().register(TypesonRegistry);
const SA_NOT_INSTALLED = 'SA_SCRIPT_NOT_INSTALLED';

export default class DomEnv {
  public static installedDomWorldName = '__sa_world__';
  public static getAttachedStateFnName = '__getSecretAgentNodeState__';

  private frameTracker: FrameTracker;
  private devtoolsClient: IDevtoolsClient;
  private isInstalled = false;
  private isClosed = false;

  constructor(frameTracker: FrameTracker, devtoolsClient: IDevtoolsClient) {
    this.frameTracker = frameTracker;
    this.devtoolsClient = devtoolsClient;
  }

  public async install() {
    if (this.isInstalled) return;
    this.isInstalled = true;
    await this.devtoolsClient.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
${typesonScript};
${typesonRegistryScript};
const TSON = new Typeson().register(Typeson.presets.builtin);

${jsPathScript};

window.SecretAgent = {
  JsPath,
  Fetcher,
};

${domStorageScript}
})();`,
      worldName: DomEnv.installedDomWorldName,
    });
  }

  public close() {
    this.isClosed = true;
  }

  public execNonIsolatedExpression<T>(expression: string, propertiesToExtract?: string[]) {
    return this.runFn<{ value: T; type: string }>(
      'getJsValue',
      `(async function() {
  const value = await ${expression};
  
  let type = typeof value;
  if (value && value.constructor) {
    type = value.constructor.name;
  }
  
  return JSON.stringify({
    value,
    type,
  });

})(${propertiesToExtract ?? [].join(',')});`,
      '',
    );
  }

  public execJsPath<T>(jsPath: IJsPath, propertiesToExtract?: string[]) {
    return this.runIsolatedFn<IExecJsPathResult<T>>(
      'window.SecretAgent.JsPath.exec',
      jsPath,
      propertiesToExtract,
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

  public getJsPathClientRect(jsPath: IJsPath) {
    return this.runIsolatedFn<IElementRect>('window.SecretAgent.JsPath.getClientRect', jsPath);
  }

  public simulateOptionClick(jsPath: IJsPath) {
    return this.runIsolatedFn<boolean>('window.SecretAgent.JsPath.simulateOptionClick', jsPath);
  }

  public scrollJsPathIntoView(jsPath: IJsPath) {
    return this.runIsolatedFn<void>('window.SecretAgent.JsPath.scrollIntoView', jsPath);
  }

  public scrollCoordinatesIntoView(coordinates: IMousePositionXY) {
    return this.runIsolatedFn<void>(
      'window.SecretAgent.JsPath.scrollCoordinatesIntoView',
      coordinates,
    );
  }

  public locationHref() {
    return this.frameTracker.runInFrameWorld<string>(
      'location.href',
      this.frameTracker.mainFrameId,
      '',
    );
  }

  private async runIsolatedFn<T>(fnName: string, ...args: SerializableOrJSHandle[]) {
    const callFn = `${fnName}(${args
      .map(x => {
        if (!x) return 'undefined';
        return JSON.stringify(x);
      })
      .join(', ')})`;
    const serializedFn = `'SecretAgent' in window ? ${callFn} : '${SA_NOT_INSTALLED}';`;
    return this.runFn<T>(fnName, serializedFn, DomEnv.installedDomWorldName);
  }

  private async runFn<T>(fnName: string, serializedFn: string, worldName: string, retries = 10) {
    const unparsedResult = await this.frameTracker.runInFrameWorld(
      serializedFn,
      this.frameTracker.mainFrameId,
      worldName,
    );

    if (unparsedResult === SA_NOT_INSTALLED) {
      if (retries === 0 || this.isClosed) throw new Error('Injected scripts not installed.');
      log.warn('Injected scripts not installed yet. Retrying', {
        fnName,
        frames: this.frameTracker.frames,
        frameId: this.frameTracker.mainFrameId,
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.runFn(fnName, serializedFn, worldName, (retries -= 1));
    }

    const result = unparsedResult ? TSON.parse(unparsedResult) : unparsedResult;
    if (result?.error) {
      log.error(fnName, result);
      throw new Error(result.error);
    } else {
      return result as T;
    }
  }
}

const typesonScript = fs.readFileSync(require.resolve('typeson/dist/typeson.min.js'), 'utf8');
const typesonRegistryScript = fs
  .readFileSync(require.resolve('typeson-registry/dist/presets/builtin.js'), 'utf8')
  .replace(/\/\/# sourceMappingURL=.+\.map/g, '');

const domStorageScript = fs.readFileSync(
  require.resolve(`@secret-agent/injected-scripts/scripts/domStorage.js`),
  'utf8',
);
const jsPathScript = fs.readFileSync(
  require.resolve(`@secret-agent/injected-scripts/scripts/jsPath.js`),
  'utf8',
);
