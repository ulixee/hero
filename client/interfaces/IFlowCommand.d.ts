import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
export default interface IFlowCommand {
    id?: number;
    parentId?: number;
    retryNumber?: number;
    callsitePath: ISourceCodeLocation[];
}
