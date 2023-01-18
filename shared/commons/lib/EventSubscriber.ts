import IRegisteredEventListener, { IEventSubscriber } from '../interfaces/IRegisteredEventListener';

type AnyFunction = (...args: any[]) => any;

let idCounter = 0;
export default class EventSubscriber implements IEventSubscriber {
  public groups: { [key: string]: IRegisteredEventListener[] } = {};
  private readonly registeredEventListeners = new Set<IRegisteredEventListener & { id: number }>();

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
    const id = idCounter++;
    const registeredEvent = { id, emitter, eventName, handler };
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
    const id = idCounter++;
    const finalHandler = (...args: Parameters<Func>): ReturnType<Func> => {
      this.removeHandlerById(id);
      return handler(...args);
    };
    const registeredEvent = { id, emitter, eventName, handler: finalHandler };
    emitter.once(eventName, finalHandler, includeUnhandledEvents);
    this.registeredEventListeners.add(registeredEvent);
    return registeredEvent;
  }

  off(...listeners: IRegisteredEventListener[]): void {
    for (const listener of listeners) {
      if (!listener.emitter) continue;
      listener.emitter.off(listener.eventName, listener.handler);
      this.registeredEventListeners.delete(listener as any);
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

  private removeHandlerById(id: number): void {
    for (const listener of this.registeredEventListeners) {
      if (listener.id === id) {
        this.registeredEventListeners.delete(listener);
        break;
      }
    }
  }
}
