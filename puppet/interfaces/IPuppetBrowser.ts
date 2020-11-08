import { IBoundLog } from '@secret-agent/commons/Logger';
import IPuppetContext from './IPuppetContext';
import IBrowserEmulationSettings from './IBrowserEmulationSettings';

export default interface IPuppetBrowser {
  newContext(emulation: IBrowserEmulationSettings, logger: IBoundLog): Promise<IPuppetContext>;
  close(): Promise<void>;
}
