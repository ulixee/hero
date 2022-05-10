import { IJsPath } from '@unblocked-web/js-path';

export default interface IJsPathEventTarget {
  addEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => any,
    options?,
  ): Promise<void>;

  removeEventListener(
    jsPath: IJsPath | null,
    eventType: string,
    listenerFn: (...args: any[]) => any,
  ): Promise<void>;
}
