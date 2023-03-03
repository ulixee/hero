import { IWorker } from '@ulixee/unblocked-specification/agent/browser/IWorker';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';

export default function setWorkerDomOverrides(
  domOverrides: DomOverridesBuilder,
  data: IBrowserData,
  worker: IWorker,
): Promise<any[]> {
  const script = domOverrides.build('worker', [
    'Error.captureStackTrace',
    'Error.constructor',
    'console.debug',
    'navigator.deviceMemory',
    'navigator.hardwareConcurrency',
    'navigator',
    'WebGLRenderingContext.prototype.getParameter',
  ]);
  if (script.callbacks.length) {
    throw new Error("Workers can't create callbacks");
  }
  return worker.evaluate(script.script, true);
}
