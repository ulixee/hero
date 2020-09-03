import * as fs from 'fs';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import { IRequestInit } from 'awaited-dom/base/interfaces/official';
import { IMousePositionXY } from '@secret-agent/core-interfaces/IInteractions';
import Log from '@secret-agent/commons/Logger';
import Typeson from 'typeson';
import TypesonRegistry from 'typeson-registry/dist/presets/builtin';
import IElementRect from '@secret-agent/injected-scripts/interfaces/IElementRect';
import IExecJsPathResult from '@secret-agent/injected-scripts/interfaces/IExecJsPathResult';
import IAttachedState from '@secret-agent/injected-scripts/interfaces/IAttachedStateCopy';
import Frames from '@secret-agent/puppet-chrome/lib/Frames';
import DomEnvError from './DomEnvError';

const { log } = Log(module);
const TSON = new Typeson().register(TypesonRegistry);
const SA_NOT_INSTALLED = 'SA_SCRIPT_NOT_INSTALLED';

export default class DomEnv {
  private readonly sessionId: string;
  private frames: Frames;
  private isInstalled = false;
  private isClosed = false;

  constructor(sessionId: string, frames: Frames) {
    this.frames = frames;
    this.sessionId = sessionId;
  }

  public async install() {
    if (this.isInstalled) return;
    this.isInstalled = true;
    await this.frames.addNewDocumentScript(
      `(function installDomEnv() {
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
    );
  }

  public close() {
    this.isClosed = true;
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

})(${propertiesToExtract ?? [].join(',')});`,
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
    return this.frames.runInFrame<string>('location.href', this.frames.mainFrameId, false);
  }

  private async runIsolatedFn<T>(fnName: string, ...args: Serializable[]) {
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
    const unparsedResult = await this.frames.runInFrame(
      serializedFn,
      this.frames.mainFrameId,
      runInIsolatedEnvironment,
    );

    if (unparsedResult === SA_NOT_INSTALLED) {
      if (retries === 0 || this.isClosed) throw new Error('Injected scripts not installed.');
      log.warn('Injected scripts not installed yet. Retrying', {
        sessionId: this.sessionId,
        fnName,
        frames: this.frames.frames,
        frameId: this.frames.mainFrameId,
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.runFn<T>(fnName, serializedFn, runInIsolatedEnvironment, retries - 1);
    }

    const result = unparsedResult ? TSON.parse(unparsedResult) : unparsedResult;
    if (result?.error) {
      log.error(fnName, { sessionId: this.sessionId, result });
      throw new DomEnvError(result.error, result.pathState);
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

type Serializable = number | string | boolean | null | Serializable[] | IJSONObject;
interface IJSONObject {
  [key: string]: Serializable;
}
