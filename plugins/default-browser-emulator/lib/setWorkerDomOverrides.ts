import { BrowserEmulatorBase } from '@secret-agent/plugin-utils';
import { IPuppetWorker } from '@secret-agent/interfaces/IPuppetWorker';
import IBrowserData from '../interfaces/IBrowserData';
import loadDomOverrides from './loadDomOverrides';

export default function setWorkerDomOverrides(
  emulator: BrowserEmulatorBase,
  data: IBrowserData,
  worker: IPuppetWorker,
): Promise<any[]> {
  const domOverrides = loadDomOverrides(emulator, data);
  const scripts = domOverrides.build([
    'Error.captureStackTrace',
    'Error.constructor',
    'navigator.deviceMemory',
    'navigator',
    'WebGLRenderingContext.prototype.getParameter',
  ]);
  return Promise.all(scripts.map(x => worker.evaluate(x.script, true)));
}
