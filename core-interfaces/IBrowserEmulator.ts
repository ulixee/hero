import { IPuppetWorker } from '@secret-agent/puppet-interfaces/IPuppetWorker';
import INetworkEmulation from './INetworkEmulation';
import IUserProfile from './IUserProfile';
import INewDocumentInjectedScript from './INewDocumentInjectedScript';
import IWindowFraming from './IWindowFraming';

export default interface IBrowserEmulator extends INetworkEmulation {
  readonly userAgentString: string;
  readonly osPlatform: string;
  readonly canPolyfill: boolean;
  readonly windowFramingBase?: IWindowFraming;
  readonly windowFraming?: IWindowFraming;
  locale: string;
  userProfile: IUserProfile;
  sessionId?: string;

  newDocumentInjectedScripts(): Promise<INewDocumentInjectedScript[]>;
  newWorkerInjectedScripts(
    workerType: IPuppetWorker['type'],
  ): Promise<INewDocumentInjectedScript[]>;
}
