import ITypedEventEmitter from './ITypedEventEmitter';
export type Callback = (...args: any[]) => void;
export type EventName = string | symbol;
export default interface IRegisteredEventListener {
    emitter: {
        off(event: string | symbol, listener: Callback): any;
    };
    eventName: EventName;
    handler: (...args: any[]) => void;
}
export interface IEventSubscriber {
    on<T, K extends keyof T & EventName>(emitter: ITypedEventEmitter<T>, eventName: K, handler: (this: ITypedEventEmitter<T>, event?: T[K], initiator?: any) => any, includeUnhandledEvents?: boolean): IRegisteredEventListener;
    on(emitter: {
        on(event: EventName, listener: Callback, includeUnhandledEvents?: boolean): any;
        off(event: EventName, listener: Callback): any;
    }, eventName: EventName, handler: Callback, includeUnhandledEvents?: boolean): IRegisteredEventListener;
    once<T, K extends keyof T & EventName>(emitter: ITypedEventEmitter<T>, eventName: K, handler: (this: ITypedEventEmitter<T>, event?: T[K], initiator?: any) => any, includeUnhandledEvents?: boolean): IRegisteredEventListener;
    once(emitter: {
        once(event: EventName, listener: Callback, includeUnhandledEvents?: boolean): any;
        off(event: EventName, listener: Callback): any;
    }, eventName: EventName, handler: Callback, includeUnhandledEvents?: boolean): IRegisteredEventListener;
    off(...events: IRegisteredEventListener[]): void;
    close(...keepEvents: string[]): void;
}
