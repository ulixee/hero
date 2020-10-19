import { IBoundLog } from '@secret-agent/commons/Logger';
import IPuppetContext from './IPuppetContext';
import IBrowserEmulation from './IBrowserEmulation';

export default interface IPuppetBrowser {
  newContext(emulation: IBrowserEmulation, logger: IBoundLog): Promise<IPuppetContext>;
  close(): Promise<void>;
}
