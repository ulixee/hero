import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import IAwaitedEventTarget from '../interfaces/IAwaitedEventTarget';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';

type IGetEventTarget = { target: Promise<IJsPathEventTarget>; jsPath?: IJsPath };

export default class AwaitedEventTarget<T> implements IAwaitedEventTarget<T> {
  constructor(readonly getEventTarget: () => Promise<IGetEventTarget> | IGetEventTarget) {}

  public async addEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (...args: any[]) => any,
    options?,
  ): Promise<void> {
    const { target, jsPath } = await this.getEventTarget();
    return (await target).addEventListener(jsPath, eventType as string, listenerFn, options);
  }

  public async removeEventListener<K extends keyof T>(
    eventType: K,
    listenerFn: (...args: any[]) => any,
  ): Promise<void> {
    const { target, jsPath } = await this.getEventTarget();
    return (await target).removeEventListener(jsPath, eventType as string, listenerFn);
  }

  // aliases

  public on<K extends keyof T>(
    eventType: K,
    listenerFn: (...args: any[]) => any,
    options?,
  ): Promise<void> {
    return this.addEventListener(eventType, listenerFn, options);
  }

  public off<K extends keyof T>(
    eventType: K,
    listenerFn: (...args: any[]) => any,
  ): Promise<void> {
    return this.removeEventListener(eventType, listenerFn);
  }

  public once<K extends keyof T>(
    eventType: K,
    listenerFn: (...args: T[K] & any[]) => any,
    options?,
  ): Promise<void> {
    const wrappedListener = (...args: any[]): Promise<void> | void => {
      listenerFn.call(this, ...args);
      return this.removeEventListener(eventType, listenerFn);
    };
    return this.addEventListener(eventType, wrappedListener, options);
  }
}
