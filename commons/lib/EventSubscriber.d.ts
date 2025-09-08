import IRegisteredEventListener, { IEventSubscriber } from '../interfaces/IRegisteredEventListener';
type AnyFunction = (...args: any[]) => any;
export default class EventSubscriber implements IEventSubscriber {
    groups: {
        [key: string]: IRegisteredEventListener[];
    };
    private readonly registeredEventListeners;
    on<K extends string | symbol, Func extends AnyFunction>(emitter: {
        on(event: K, listener: (...args: Parameters<Func>) => ReturnType<Func>, includeUnhandledEvents?: boolean): any;
        off(event: K, listener: (...args: Parameters<Func>) => ReturnType<Func>): any;
    }, eventName: K, handler: (...args: Parameters<Func>) => ReturnType<Func>, includeUnhandledEvents?: boolean): IRegisteredEventListener;
    once<K extends string | symbol, Func extends AnyFunction>(emitter: {
        once(event: K, listener: (...args: Parameters<Func>) => ReturnType<Func>, includeUnhandledEvents?: boolean): any;
        off(event: K, listener: (...args: Parameters<Func>) => ReturnType<Func>): any;
    }, eventName: K, handler: (...args: Parameters<Func>) => ReturnType<Func>, includeUnhandledEvents?: boolean): IRegisteredEventListener;
    off(...listeners: IRegisteredEventListener[]): void;
    close(...keepMockEvents: (string | symbol)[]): void;
    group(name: string, ...listeners: IRegisteredEventListener[]): void;
    endGroup(name: string): void;
    private removeHandlerById;
}
export {};
