import { IRunner, IRunnerFactory } from '@double-agent/runner/interfaces/IRunnerFactory';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import { Browser } from 'puppeteer';
export default class PuppeteerRunnerFactory implements IRunnerFactory {
    browser?: Browser;
    runnerId(): string;
    startFactory(): Promise<void>;
    spawnRunner(assignment: IAssignment): Promise<IRunner>;
    stopFactory(): Promise<void>;
}
