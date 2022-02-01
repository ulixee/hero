import AwaitedHandler, { NotImplementedError } from 'awaited-dom/base/AwaitedHandler';
import AwaitedPath, { IJsPath } from 'awaited-dom/base/AwaitedPath';
import Constructable from 'awaited-dom/base/Constructable';
import INodePointer from 'awaited-dom/base/INodePointer';
import IExecJsPathResult from '@ulixee/hero-interfaces/IExecJsPathResult';
import { getNodePointerFnName } from '@ulixee/hero-interfaces/jsPathFnNames';
import StateMachine from 'awaited-dom/base/StateMachine';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import NodeFactory from 'awaited-dom/base/NodeFactory';
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

interface IStateHandler<TClass> {
  getState(instance: TClass): any;
  setState(instance: TClass, properties: any): void;
  className?: string;
}

const storageSymbol = Symbol.for('@ulixee/InternalAwaitedState');
export function isAwaitedNode(node: any): boolean {
  return !!node && !!node[storageSymbol];
}
// Sets up AwaitedHandler initializer hooks. See Noderdom/AwaitedDOM
AwaitedHandler.delegate = delegate;
AwaitedHandler.setStorageSymbol(storageSymbol);

async function getProperty<T, TClass>(
  stateHandler: IStateHandler<TClass>,
  instance: TClass,
  name: string,
): Promise<T> {
  const { awaitedPath, coreFrame, awaitedOptions } = await getAwaitedState(stateHandler, instance);
  const finalPath = awaitedPath.addProperty(instance as any, name);

  const result = await execJsPath<T>(coreFrame, awaitedOptions, finalPath.toJSON());
  return cleanResult(stateHandler, instance, result, new Error().stack);
}

async function setProperty<T, TClass>(
  stateHandler: IStateHandler<TClass>,
  instance: TClass,
  name: string,
  value: T,
): Promise<void> {
  await awaitRemoteInitializer(stateHandler.getState(instance));
  stateHandler.setState(instance, { [name]: value });
}

async function runMethod<T, TClass>(
  stateHandler: IStateHandler<TClass>,
  instance: TClass,
  name: string,
  args: any[],
): Promise<T> {
  const { awaitedPath, coreFrame, awaitedOptions } = await getAwaitedState(stateHandler, instance);
  const finalPath = awaitedPath.addMethod(instance as any, name, ...args);

  const result = await execJsPath<T>(coreFrame, awaitedOptions, finalPath.toJSON());
  return cleanResult(stateHandler, instance, result, new Error().stack);
}

async function createNodePointer<TClass>(
  stateHandler: IStateHandler<TClass>,
  instance: TClass,
): Promise<INodePointer> {
  const { awaitedPath, coreFrame, awaitedOptions } = await getAwaitedState(stateHandler, instance);
  const finalPath = awaitedPath.addMethod(instance as any, getNodePointerFnName);

  const result = await execJsPath<null>(coreFrame, awaitedOptions, finalPath.toJSON());
  return result?.nodePointer;
}

function runStatic<T, TClass>(
  stateHandler: IStateHandler<TClass>,
  _klass: Constructable<TClass>,
  name: string,
): T {
  throw new NotImplementedError(`${stateHandler.className}.${name} static method not implemented`);
}

function construct<TClass>(self: AwaitedHandler<TClass>): TClass {
  throw new NotImplementedError(`${self.className} constructor not implemented`);
}

export async function getAwaitedState<TClass>(
  stateHandler: IStateHandler<TClass>,
  instance: TClass,
): Promise<{
  awaitedPath: AwaitedPath;
  coreFrame: CoreFrameEnvironment;
  awaitedOptions: IAwaitedOptions;
}> {
  const state = stateHandler.getState(instance);
  await awaitRemoteInitializer(state);
  const awaitedPath = state.awaitedPath as AwaitedPath;
  const awaitedOptions = state.awaitedOptions as IAwaitedOptions;
  const awaitedCoreFrame = await awaitedOptions.coreFrame;
  return { awaitedPath, coreFrame: awaitedCoreFrame, awaitedOptions };
}

export function getAwaitedPathAsMethodArg(awaitedPath: AwaitedPath): string {
  return `$$jsPath=${JSON.stringify(awaitedPath.toJSON())}`;
}

export function createInstanceWithNodePointer<TClass>(
  stateHandler: IStateHandler<TClass>,
  awaitedPath: AwaitedPath,
  awaitedOptions: IAwaitedOptions,
  nodePointer: INodePointer,
): TClass {
  const createNewInstance =
    NodeFactory.instanceCreatorsByName[`create${nodePointer.type}`] ??
    NodeFactory.instanceCreatorsByName.createSuperNode;
  const newPath = awaitedPath.withNodeId(awaitedPath.parent, nodePointer.id);
  const element = createNewInstance(newPath, awaitedOptions);
  stateHandler.setState(element, {
    nodePointer,
  });
  element.then = null;
  return element;
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

export async function execJsPath<T>(
  coreFrame: CoreFrameEnvironment,
  awaitedOptions: IAwaitedOptions & { prefetchedJsPaths?: Promise<Map<string, IJsPathResult>> },
  path: IJsPath,
): Promise<IExecJsPathResult<T>> {
  convertJsPathArgs(path);
  if (awaitedOptions.prefetchedJsPaths) {
    const prefetchedJsPaths = await awaitedOptions.prefetchedJsPaths;
    const prefetched = prefetchedJsPaths.get(JSON.stringify(path));
    if (prefetched) {
      const result = prefetched.result;
      coreFrame.recordDetachedJsPath(prefetched.index, new Date(), new Date());
      return result;
    }
  }
  return coreFrame.execJsPath<T>(path);
}

export function cleanResult<T, TClass>(
  stateHandler: IStateHandler<TClass>,
  instance: TClass,
  result: IExecJsPathResult<T>,
  startStack: string,
): T {
  if (!result) return null;

  if (result.nodePointer) {
    stateHandler.setState(instance, {
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

async function awaitRemoteInitializer(state: IAwaitedOptions): Promise<void> {
  if (state?.remoteInitializerPromise) {
    await state.remoteInitializerPromise;
  }
}
