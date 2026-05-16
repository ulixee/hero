import { IRunner, IRunnerFactory } from '@double-agent/runner/interfaces/IRunnerFactory';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
export default class UnblockedRunnerFactory implements IRunnerFactory {
    private pool;
    runnerId(): string;
    startFactory(): Promise<void>;
    spawnRunner(assignment: IAssignment): Promise<IRunner>;
    stopFactory(): Promise<void>;
}
