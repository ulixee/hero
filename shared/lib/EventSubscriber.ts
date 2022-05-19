import IRegisteredEventListener, { IEventSubscriber } from '../interfaces/IRegisteredEventListener';

type AnyFunction = (...args: any[]) => any;

export default class EventSubscriber implements IEventSubscriber {
  public groups: { [key: string]: IRegisteredEventListener[] } = {};
  private readonly registeredEventListeners = new Set<IRegisteredEventListener>();

  on<K extends string | symbol, Func extends AnyFunction>(
    emitter: {
      on(
        event: K,
        listener: (...args: Parameters<Func>) => ReturnType<Func>,
        includeUnhandledEvents?: boolean,
      );
      off(event: K, listener: (...args: Parameters<Func>) => ReturnType<Func>);
    },
    eventName: K,
    handler: (...args: Parameters<Func>) => ReturnType<Func>,
    includeUnhandledEvents?: boolean,
  ): IRegisteredEventListener {
    emitter.on(eventName, handler, includeUnhandledEvents);
    const registeredEvent: IRegisteredEventListener = { emitter, eventName, handler };
    this.registeredEventListeners.add(registeredEvent);
    return registeredEvent;
  }

  once<K extends string | symbol, Func extends AnyFunction>(
    emitter: {
      once(
        event: K,
        listener: (...args: Parameters<Func>) => ReturnType<Func>,
        includeUnhandledEvents?: boolean,
      );
      off(event: K, listener: (...args: Parameters<Func>) => ReturnType<Func>);
    },
    eventName: K,
    handler: (...args: Parameters<Func>) => ReturnType<Func>,
    includeUnhandledEvents?: boolean,
  ): IRegisteredEventListener {
    emitter.once(eventName, handler, includeUnhandledEvents);
    const registeredEvent: IRegisteredEventListener = { emitter, eventName, handler };
    this.registeredEventListeners.add(registeredEvent);
    return registeredEvent;
  }

  off(...listeners: IRegisteredEventListener[]): void {
    for (const listener of listeners) {
      listener.emitter.off(listener.eventName, listener.handler);
      this.registeredEventListeners.delete(listener);
    }
    listeners.length = 0;
  }

  close(...keepMockEvents: (string | symbol)[]): void {
    for (const listener of this.registeredEventListeners) {
      if (keepMockEvents.includes(listener.eventName)) {
        // add a mock event handler (like for capturing events)
        (listener.emitter as any).on(listener.eventName, () => null);
      }
      listener.emitter.off(listener.eventName, listener.handler);
    }
    this.registeredEventListeners.clear();
  }

  group(name: string, ...listeners: IRegisteredEventListener[]): void {
    this.groups[name] ??= [];
    this.groups[name].push(...listeners);
  }

  endGroup(name: string): void {
    const events = this.groups[name];
    delete this.groups[name];
    if (events) this.off(...events);
  }
}
