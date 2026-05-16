import { IJsPath } from '@ulixee/js-path';
export default interface IJsPathEventTarget {
    addEventListener(jsPath: IJsPath | null, eventType: string, listenerFn: (...args: any[]) => any, options?: any): Promise<void>;
    removeEventListener(jsPath: IJsPath | null, eventType: string, listenerFn: (...args: any[]) => any): Promise<void>;
}
