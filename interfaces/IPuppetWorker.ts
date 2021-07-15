import ITypedEventEmitter from './ITypedEventEmitter';
import IDevtoolsSession from './IDevtoolsSession';

export interface IPuppetWorker extends ITypedEventEmitter<IPuppetWorkerEvents> {
  id: string;
  url: string;
  devtoolsSession: IDevtoolsSession;
  type: 'service_worker' | 'shared_worker' | 'worker';
  hasLoadedResponse: boolean;
  isReady: Promise<Error | null>;
  isInitializationSent: Promise<void>;
  evaluate<T>(expression: string, isInitializationScript?: boolean): Promise<T>;
}

export interface IPuppetWorkerEvents {
  close: null;
  'page-error': { error: Error };
  console: { frameId: string; type: string; message: string; location: string };
}
