import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
export interface IRunnerFactory {
    runnerId(): string;
    startFactory(): Promise<void>;
    spawnRunner(assignment: IAssignment): Promise<IRunner>;
    stopFactory(): Promise<void>;
}
export interface IRunner {
    run(assignment: IAssignment, filters?: IRunnerFilter): Promise<void>;
    stop(): Promise<void>;
}
export interface IRunnerFilter {
    onlyRunPluginIds: string[];
}
