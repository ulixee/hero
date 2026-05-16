import { IWorker } from '@ulixee/unblocked-specification/agent/browser/IWorker';
import IBrowserData from '../interfaces/IBrowserData';
import DomOverridesBuilder from './DomOverridesBuilder';
export default function setWorkerDomOverrides(domOverrides: DomOverridesBuilder, data: IBrowserData, worker: IWorker): Promise<any[]>;
