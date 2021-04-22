import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import { IPuppetWorker } from '@secret-agent/interfaces/IPuppetWorker';
import INetworkEmulation from './INetworkEmulation';
import IWindowFraming from './IWindowFraming';
import IBrowserEmulatorConfiguration from './IBrowserEmulatorConfiguration';

export default interface IBrowserEmulator extends INetworkEmulation {
  readonly userAgentString: string;
  readonly osPlatform: string;
  readonly canPolyfill: boolean;
  readonly windowFramingBase?: IWindowFraming;
  readonly windowFraming?: IWindowFraming;
  configuration: IBrowserEmulatorConfiguration;
  sessionId: string;

  configure(options: IBrowserEmulatorConfiguration): Promise<void>;

  onNewPuppetPage(page: IPuppetPage): Promise<any>;
  onNewPuppetWorker?(worker: IPuppetWorker): Promise<any>;
}
