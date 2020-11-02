import StateMachine from 'awaited-dom/base/StateMachine';
import IAwaitedEventTarget, { IAwaitedEventTargetState } from '../interfaces/IAwaitedEventTarget';

const { getState } = StateMachine<any, any>();

export default class AwaitedEventTarget<T, IState extends IAwaitedEventTargetState>
  implements IAwaitedEventTarget<T> {
  public async addEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void> {
    const { awaitedPath, coreTab } = getState(this) as IState;
    const jsPath = awaitedPath ? awaitedPath.toJSON() : null;
    const tab = await coreTab;
    return tab.addEventListener(jsPath, eventType as string, listenerFn, options);
  }

  public async removeEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
  ): Promise<void> {
    const { awaitedPath, coreTab } = getState(this) as IState;
    const jsPath = awaitedPath ? awaitedPath.toJSON() : null;
    const tab = await coreTab;
    return tab.removeEventListener(jsPath, eventType as string, listenerFn);
  }

  // aliases

  public on<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void> {
    return this.addEventListener(eventType, listenerFn, options);
  }

  public off<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
  ): Promise<void> {
    return this.removeEventListener(eventType, listenerFn);
  }

  public once<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void> {
    const wrappedListener = (event: T[K]) => {
      listenerFn.call(this, event);
      this.removeEventListener(eventType, listenerFn);
      return null;
    };
    return this.addEventListener(eventType, wrappedListener, options);
  }
}
