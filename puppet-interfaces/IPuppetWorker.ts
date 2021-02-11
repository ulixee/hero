import ITypedEventEmitter from '@secret-agent/core-interfaces/ITypedEventEmitter';

export interface IPuppetWorker extends ITypedEventEmitter<IPuppetWorkerEvents> {
  id: string;
  url: string;
  type: 'service_worker' | 'worker';
  isReady: Promise<Error | null>;
  evaluate<T>(expression: string, isInitializationScript?: boolean): Promise<T>;
}

export interface IPuppetWorkerEvents {
  close: null;
  'page-error': { error: Error };
  console: { frameId: string; type: string; message: string; location: string };
}
