import { IJsPath } from 'awaited-dom/base/AwaitedPath';

export default interface IJsPathEventTarget {
  addEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
    options?,
  ): Promise<void>;

  removeEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => void,
  ): Promise<void>;
}
