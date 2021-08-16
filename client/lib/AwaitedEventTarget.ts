import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IAwaitedEventTarget from '../interfaces/IAwaitedEventTarget';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';

type IGetEventTarget = { target: Promise<IJsPathEventTarget>; jsPath?: IJsPath };
type Arguments<T> = [T] extends [(...args: infer U) => any] ? U : [T] extends [void] ? [] : [T];

export default class AwaitedEventTarget<T> implements IAwaitedEventTarget<T> {
  constructor(readonly getEventTarget: () => Promise<IGetEventTarget> | IGetEventTarget) {}

  public async addEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: T[K] & Function,
    options?,
  ): Promise<void> {
    const { target, jsPath } = await this.getEventTarget();
    return (await target).addEventListener(jsPath, eventType as string, listenerFn as any, options);
  }

  public async removeEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: T[K] & Function,
  ): Promise<void> {
    const { target, jsPath } = await this.getEventTarget();
    return (await target).removeEventListener(jsPath, eventType as string, listenerFn as any);
  }

  // aliases

  public on<K extends keyof T>(eventType: K, listenerFn: T[K] & Function, options?): Promise<void> {
    return this.addEventListener(eventType, listenerFn, options);
  }

  public off<K extends keyof T>(eventType: K, listenerFn: T[K] & Function): Promise<void> {
    return this.removeEventListener(eventType, listenerFn);
  }

  public once<K extends keyof T>(
    eventType: K,
    listenerFn: T[K] & Function,
    options?,
  ): Promise<void> {
    const wrappedListener = (...args: Arguments<T[K]>): Promise<void> | void => {
      listenerFn.call(this, ...args);
      return this.removeEventListener(eventType, listenerFn);
    };
    return this.addEventListener(eventType, wrappedListener as any, options);
  }
}
