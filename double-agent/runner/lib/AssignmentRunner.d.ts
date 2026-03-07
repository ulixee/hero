import Queue from 'p-queue';
import { IRunnerFactory } from '../interfaces/IRunnerFactory';
export default class AssignmentRunner {
    runnerFactory: IRunnerFactory;
    private userAgentsToTestPath;
    private assignmentsDataOutDir;
    readonly queue: Queue;
    beforeFinishFn?: () => Promise<void>;
    constructor(runnerFactory: IRunnerFactory, userAgentsToTestPath: string, assignmentsDataOutDir: string, runnerConcurrency?: number);
    run(): Promise<void>;
    runFactoryRunners(runnerID: string): Promise<void>;
}
