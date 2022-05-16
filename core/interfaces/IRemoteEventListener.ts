import { IJsPath } from '@unblocked-web/js-path';

export type IRemoteEmitFn = (listenerId: string, ...eventArgs: any[]) => void;

export interface IRemoteEventListener {
  addRemoteEventListener(
    type: string,
    emitFn: IRemoteEmitFn,
    jsPath?: IJsPath,
    options?: any,
  ): Promise<{ listenerId: string }>;
  removeRemoteEventListener(listenerId: string, options?: any): Promise<any>;
}
