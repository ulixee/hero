import StateMachine from 'awaited-dom/base/StateMachine';

const { getState } = StateMachine<any, any>();

export default class AwaitedEventTarget<T> {
  public async addEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void> {
    const { coreClientSession, awaitedPath } = getState(this);
    const jsPath = awaitedPath ? awaitedPath.toJSON() : null;
    return coreClientSession.addEventListener(jsPath, eventType, listenerFn, options);
  }

  public removeEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): void {
    const { coreClientSession, awaitedPath } = getState(this);
    const jsPath = awaitedPath ? awaitedPath.toJSON() : null;
    return coreClientSession.removeEventListener(jsPath, eventType, listenerFn, options);
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
    options?,
  ): void {
    return this.removeEventListener(eventType, listenerFn, options);
  }

  public once<K extends keyof T>(
    eventType: K,
    listenerFn: (this: this, event: T[K]) => any,
    options?,
  ): Promise<void> {
    const wrappedListener = (event: T[K]) => {
      listenerFn.call(this, event);
      this.removeEventListener(eventType, listenerFn, options);
      return null;
    };
    return this.addEventListener(eventType, wrappedListener, options);
  }
}
