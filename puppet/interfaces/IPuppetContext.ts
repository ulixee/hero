import { URL } from 'url';
import { ICookie } from '@secret-agent/core-interfaces/ICookie';
import ITypedEventEmitter from '@secret-agent/commons/interfaces/ITypedEventEmitter';
import { IPuppetPage } from './IPuppetPage';
import IBrowserEmulation from './IBrowserEmulation';

export default interface IPuppetContext extends ITypedEventEmitter<IPuppetContextEvents> {
  emulation: IBrowserEmulation;

  newPage(): Promise<IPuppetPage>;
  close(): Promise<void>;

  getCookies(url?: URL): Promise<ICookie[]>;
  addCookies(
    cookies: (Omit<ICookie, 'expires'> & { expires?: string | Date | number })[],
    origins?: string[],
  ): Promise<void>;
}

export interface IPuppetContextEvents {
  page: { page: IPuppetPage };
  'devtools-message': {
    direction: 'send' | 'receive';
    timestamp: Date;
    pageTargetId?: string;
    workerTargetId?: string;
    frameId?: string;
    sessionType: 'page' | 'worker' | 'browser';
    sessionId: string;
    method?: string;
    id?: number;
    params?: any;
    error?: any;
    result?: any;
  };
}
