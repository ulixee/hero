import { IRunner, IRunnerFilter } from '@double-agent/runner/interfaces/IRunnerFactory';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';
export default abstract class BaseRunner implements IRunner {
    currentPage?: ISessionPage;
    isFirst: boolean;
    run(assignment: IAssignment, filters?: IRunnerFilter): Promise<void>;
    abstract stop(): Promise<void>;
    abstract runPage(assignment: IAssignment, page: ISessionPage, step: string): Promise<void>;
}
