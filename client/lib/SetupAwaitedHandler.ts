import AwaitedHandler, { NotImplementedError } from 'awaited-dom/base/AwaitedHandler';
import AwaitedPath, { IJsPath } from 'awaited-dom/base/AwaitedPath';
import Constructable from 'awaited-dom/base/Constructable';
import INodePointer from 'awaited-dom/base/INodePointer';
import IExecJsPathResult from '@secret-agent/interfaces/IExecJsPathResult';
import { getNodePointerFnName } from '@secret-agent/interfaces/jsPathFnNames';
import StateMachine from 'awaited-dom/base/StateMachine';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';
import CoreFrameEnvironment from './CoreFrameEnvironment';

export const delegate = {
  getProperty,
  setProperty,
  construct,
  runMethod,
  runStatic,
  createNodePointer,
};

// Sets up AwaitedHandler initializer hooks. See Noderdom/AwaitedDOM
AwaitedHandler.delegate = delegate;
AwaitedHandler.setStorageSymbol(Symbol.for('@secret-agent/InternalAwaitedState'));

async function getProperty<T, TClass>(
  self: AwaitedHandler<TClass>,
  instance: TClass,
  name: string,
): Promise<T> {
  const { awaitedPath, coreFrame } = await getAwaitedState(self, instance);
  const finalPath = awaitedPath.addProperty(instance as any, name);

  const result = await execJsPath<TClass, T>(self, coreFrame, instance, finalPath.toJSON());
  return cleanResult(self, instance, result, new Error().stack);
}

async function setProperty<T, TClass>(
  self: AwaitedHandler<TClass>,
  instance: TClass,
  name: string,
  value: T,
): Promise<void> {
  await awaitRemoteInitializer(self.getState(instance));
  self.setState(instance, { [name]: value });
}

async function runMethod<T, TClass>(
  self: AwaitedHandler<TClass>,
  instance: TClass,
  name: string,
  args: any[],
): Promise<T> {
  const { awaitedPath, coreFrame } = await getAwaitedState(self, instance);
  const finalPath = awaitedPath.addMethod(instance as any, name, ...args);

  const result = await execJsPath<TClass, T>(self, coreFrame, instance, finalPath.toJSON());
  return cleanResult(self, instance, result, new Error().stack);
}

async function createNodePointer<TClass>(
  self: AwaitedHandler<TClass>,
  instance: TClass,
): Promise<INodePointer> {
  const { awaitedPath, coreFrame } = await getAwaitedState(self, instance);
  const finalPath = awaitedPath.addMethod(instance as any, getNodePointerFnName);

  const result = await execJsPath<TClass, null>(self, coreFrame, instance, finalPath.toJSON());
  return result?.nodePointer;
}

function runStatic<T, TClass>(
  self: AwaitedHandler<TClass>,
  _klass: Constructable<TClass>,
  name: string,
): T {
  throw new NotImplementedError(`${self.className}.${name} static method not implemented`);
}

function construct<TClass>(self: AwaitedHandler<TClass>): TClass {
  throw new NotImplementedError(`${self.className} constructor not implemented`);
}

async function getAwaitedState<TClass>(
  self: AwaitedHandler<TClass>,
  instance: TClass,
): Promise<{
  awaitedPath: AwaitedPath;
  coreFrame: CoreFrameEnvironment;
}> {
  await awaitRemoteInitializer(instance);
  const state = self.getState(instance);
  const awaitedPath = state.awaitedPath as AwaitedPath;
  const { coreFrame } = state.awaitedOptions as IAwaitedOptions;
  const awaitedCoreFrame = await coreFrame;
  return { awaitedPath, coreFrame: awaitedCoreFrame };
}

export function getAwaitedPathAsMethodArg(awaitedPath: AwaitedPath): string {
  return `$$jsPath=${JSON.stringify(awaitedPath.toJSON())}`;
}

const { getState: getAwaitedPathState } = StateMachine<any, { awaitedPath?: AwaitedPath }>();

export function convertJsPathArgs(path: IJsPath): void {
  for (const part of path) {
    // if part is method call, see if any params need to be remotely initialized first
    if (!Array.isArray(part)) continue;

    for (let i = 0; i < part.length; i += 1) {
      const param = part[i];
      if (typeof param === 'object') {
        if (Array.isArray(param)) {
          convertJsPathArgs(param);
        } else {
          const awaitedPath = getAwaitedPathState(param)?.awaitedPath;
          if (awaitedPath) {
            part[i] = getAwaitedPathAsMethodArg(awaitedPath);
          }
        }
      }
    }
  }
}

async function execJsPath<TClass, T>(
  self: AwaitedHandler<TClass>,
  coreFrame: CoreFrameEnvironment,
  instance: TClass,
  path: IJsPath,
): Promise<IExecJsPathResult<T>> {
  convertJsPathArgs(path);
  const { awaitedOptions } = await self.getState(instance);
  if (awaitedOptions.prefetchedJsPaths) {
    const prefetchedJsPaths = await awaitedOptions.prefetchedJsPaths;
    const prefetched = prefetchedJsPaths.get(JSON.stringify(path));
    if (prefetched) {
      return prefetched.result;
    }
  }
  return coreFrame.execJsPath<T>(path);
}

function cleanResult<T, TClass>(
  self: AwaitedHandler<TClass>,
  instance: TClass,
  result: IExecJsPathResult<T>,
  startStack: string,
): T {
  if (!result) return null;

  if (result.nodePointer) {
    self.setState(instance, {
      nodePointer: result.nodePointer,
    });
  }
  if (result?.pathError) {
    const error = new Error(result.pathError.error);
    error.name = 'InjectedScriptError';
    (error as any).pathState = result.pathError.pathState;
    error.stack = startStack.replace('Error:', '').trim();
    throw error;
  }
  return result.value;
}

async function awaitRemoteInitializer(state: any): Promise<void> {
  if (state?.remoteInitializerPromise) {
    await state.remoteInitializerPromise;
  }
}
