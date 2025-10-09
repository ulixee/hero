import { IJsPath } from '@ulixee/js-path';
import IAwaitedEventTarget from '../interfaces/IAwaitedEventTarget';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
type IGetEventTarget = {
    target: Promise<IJsPathEventTarget>;
    jsPath?: IJsPath;
};
export default class AwaitedEventTarget<T> implements IAwaitedEventTarget<T> {
    readonly getEventTarget: () => Promise<IGetEventTarget> | IGetEventTarget;
    constructor(getEventTarget: () => Promise<IGetEventTarget> | IGetEventTarget);
    addEventListener<K extends keyof T>(eventType: K, listenerFn: T[K] & Function, options?: any): Promise<void>;
    removeEventListener<K extends keyof T>(eventType: K, listenerFn: T[K] & Function): Promise<void>;
    on<K extends keyof T>(eventType: K, listenerFn: T[K] & Function, options?: any): Promise<void>;
    off<K extends keyof T>(eventType: K, listenerFn: T[K] & Function): Promise<void>;
    once<K extends keyof T>(eventType: K, listenerFn: T[K] & Function, options?: any): Promise<void>;
}
export {};
