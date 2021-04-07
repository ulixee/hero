import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import IPuppetContext from './IPuppetContext';
import IBrowserEmulationSettings from './IBrowserEmulationSettings';

export default interface IPuppetBrowser {
  getFeatures(): Promise<{
    supportsPerBrowserContextProxy: boolean;
    version: { major: string; minor: string };
  }>;
  newContext(emulation: IBrowserEmulationSettings, logger: IBoundLog): Promise<IPuppetContext>;
  close(): Promise<void>;
}
