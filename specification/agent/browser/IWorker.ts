import type ITypedEventEmitter from '@ulixee/commons/interfaces/ITypedEventEmitter';
import IDevtoolsSession from './IDevtoolsSession';

export interface IWorker extends ITypedEventEmitter<IWorkerEvents> {
  id: string;
  url: string;
  devtoolsSession: IDevtoolsSession;
  type: 'service_worker' | 'shared_worker' | 'worker';
  isReady: Promise<Error | null>;
  evaluate<T>(expression: string, isInitializationScript?: boolean): Promise<T>;
}

export interface IWorkerEvents {
  close: null;
  'page-error': { error: Error };
  console: { frameId: string; type: string; message: string; location: string };
}
