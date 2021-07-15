import { IPuppetWorker } from '@ulixee/hero-interfaces/IPuppetWorker';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';

export default function setWorkerDomOverrides(
  domOverrides: DomOverridesBuilder,
  data: IBrowserData,
  worker: IPuppetWorker,
): Promise<any[]> {
  const scripts = domOverrides.build([
    'Error.captureStackTrace',
    'Error.constructor',
    'navigator.deviceMemory',
    'navigator',
    'WebGLRenderingContext.prototype.getParameter',
  ]);
  return Promise.all(scripts.map(x => worker.evaluate(x.script, true)));
}
