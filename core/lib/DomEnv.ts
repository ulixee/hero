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

export default class DomEnv {
  public static installedDomWorldName = '__sa_world__';
  public static getAttachedStateFnName = '__getSecretAgentNodeState__';

  private frameTracker: FrameTracker;
  private devtoolsClient: IDevtoolsClient;
  private isInstalled = false;

  constructor(frameTracker: FrameTracker, devtoolsClient: IDevtoolsClient) {
    this.frameTracker = frameTracker;
    this.devtoolsClient = devtoolsClient;
  }

  public async install() {
    if (this.isInstalled) return;
    this.isInstalled = true;
    await this.devtoolsClient.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
(() => {
${typesonScript};
${typesonRegistryScript};
const TSON = new Typeson().register(Typeson.presets.builtin);

${jsPathScript};

window.SecretAgent = {
  JsPath,
  Fetcher,
};

${domStorageScript}
})()`,
      worldName: DomEnv.installedDomWorldName,
    });
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

})(${propertiesToExtract ?? [].join(',')})`,
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

  private async runIsolatedFn<T>(fnName: string, ...args: SerializableOrJSHandle[]) {
    const serializedFn = `${fnName}(${args
      .map(x => {
        if (!x) return 'undefined';
        return JSON.stringify(x);
      })
      .join(', ')})`;
    return this.runFn<T>(fnName, serializedFn, DomEnv.installedDomWorldName);
  }

  private async runFn<T>(fnName: string, serializedFn: string, worldName: string) {
    const unparsedResult = await this.frameTracker.runInFrame(
      serializedFn,
      this.frameTracker.mainFrameId,
      worldName,
    );
    if (unparsedResult) {
      const result = unparsedResult ? TSON.parse(unparsedResult) : unparsedResult;
      if (result?.error) {
        log.error(fnName, result);
        throw new Error(result.error);
      }
      return result as T;
    }
  }
}

const typesonScript = fs.readFileSync(require.resolve('typeson/dist/typeson.min.js'), 'utf8');
const typesonRegistryScript = fs.readFileSync(
  require.resolve('typeson-registry/dist/presets/builtin.js'),
  'utf8',
);

const domStorageScript = fs.readFileSync(
  require.resolve(`@secret-agent/injected-scripts/dist/scripts/domStorage.js`),
  'utf8',
);
const jsPathScript = fs.readFileSync(
  require.resolve(`@secret-agent/injected-scripts/dist/scripts/jsPath.js`),
  'utf8',
);
