import { ITypedEventEmitter } from '@secret-agent/commons/eventUtils';

export interface IPuppetWorker extends ITypedEventEmitter<IPuppetWorkerEvents> {
  id: string;
  url: string;
  type: string;
  evaluate<T>(expression: string): Promise<T>;
}

export interface IPuppetWorkerEvents {
  close: null;
  'page-error': { error: Error };
  console: { frameId: string; type: string; message: string; location: string };
}
