import StateMachine from 'awaited-dom/base/StateMachine';
import { getTabSession } from './Tab';

const { getState } = StateMachine<any, any>();

export default class AwaitedEventTarget<T> {
  public async addEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void> {
    const { activeTab, awaitedPath } = getState(this);
    const coreTab = getTabSession(activeTab);
    const jsPath = awaitedPath ? awaitedPath.toJSON() : null;
    return coreTab.addEventListener(jsPath, eventType as string, listenerFn, options);
  }

  public removeEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
  ): Promise<void> {
    const { activeTab, awaitedPath } = getState(this);
    const coreTab = getTabSession(activeTab);
    const jsPath = awaitedPath ? awaitedPath.toJSON() : null;
    return coreTab.removeEventListener(jsPath, eventType as string, listenerFn);
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
