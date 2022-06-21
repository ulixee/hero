import { IWorker } from '@unblocked-web/specifications/agent/browser/IWorker';
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
    'navigator.deviceMemory',
    'navigator',
    'WebGLRenderingContext.prototype.getParameter',
  ]);
  if (script.callbacks.length) {
    throw new Error("Workers can't create callbacks");
  }
  return worker.evaluate(script.script, true);
}
