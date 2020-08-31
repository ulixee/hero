import AwaitedHandler, { NotImplementedError } from 'awaited-dom/base/AwaitedHandler';
import AwaitedPath from 'awaited-dom/base/AwaitedPath';
import Constructable from 'awaited-dom/base/Constructable';
import IAttachedState from 'awaited-dom/base/IAttachedState';
import IExecJsPathResult from '@secret-agent/core/interfaces/IExecJsPathResult';
import getAttachedStateFnName from '@secret-agent/core-interfaces/getAttachedStateFnName';
import IAwaitedOptions from '../interfaces/IAwaitedOptions';

// Sets up AwaitedHandler initializer hooks. See Noderdom/AwaitedDOM
AwaitedHandler.initializer = function initializer<TClass>(self: AwaitedHandler<TClass>) {
  self.getProperty = async function getProperty<T>(instance: TClass, name: string): Promise<T> {
    await awaitRemoteInitializer(instance);
    const state = self.getState(instance);
    const awaitedPath = state.awaitedPath as AwaitedPath;
    const { coreClientSession } = state.awaitedOptions as IAwaitedOptions;
    const result = await coreClientSession.execJsPath<T>(awaitedPath.addProperty(name).toJSON());

    return cleanResult(instance, result);
  };

  self.setProperty = async function setProperty<T>(instance: TClass, name: string, value: T) {
    await awaitRemoteInitializer(instance);
    self.setState(instance, { [name]: value });
  };

  self.runMethod = async function runMethod<T>(
    instance: TClass,
    name: string,
    args: any[],
  ): Promise<T> {
    await awaitRemoteInitializer(instance);
    const state = self.getState(instance);
    const awaitedPath = state.awaitedPath as AwaitedPath;
    const { coreClientSession } = state.awaitedOptions as IAwaitedOptions;
    const result = await coreClientSession.execJsPath<T>(
      awaitedPath.addMethod(name, ...args).toJSON(),
    );
    return cleanResult(instance, result);
  };

  self.runStatic = function runStatic<T>(_klass: Constructable<TClass>, name: string): T {
    throw new NotImplementedError(`${self.className}.${name} static method not implemented`);
  };

  self.loadState = async function loadState(instance: TClass, properties?: string[]) {
    await awaitRemoteInitializer(instance);
    const state = self.getState(instance);
    const awaitedPath = state.awaitedPath as AwaitedPath;
    const { coreClientSession } = state.awaitedOptions as IAwaitedOptions;
    const result = await coreClientSession.execJsPath(
      awaitedPath.addMethod(getAttachedStateFnName, properties).toJSON(),
    );

    return result?.attachedState as IAttachedState;
  };

  async function awaitRemoteInitializer(instance: TClass) {
    const state = self.getState(instance);
    if (state?.remoteInitializerPromise) {
      await state.remoteInitializerPromise;
    }
  }

  function cleanResult<T>(instance: TClass, result: IExecJsPathResult<T>) {
    if (!result) return null;
    if (!result?.attachedState) return result?.value;

    self.setState(instance, {
      attachedState: result.attachedState,
    });
    delete result.attachedState;

    return result.value;
  }
};
