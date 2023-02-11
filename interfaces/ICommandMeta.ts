import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';

export default interface ICommandMeta {
  id: number;
  tabId: number;
  frameId: number;
  name: string;
  retryNumber: number;
  args?: any;
  clientStartDate?: number;
  clientSendDate?: number;
  runStartDate: number;
  endDate?: number;
  result?: any;
  resultType?: string;
  callsite?: ISourceCodeLocation[];
  startNavigationId?: number;
  endNavigationId?: number;
  activeFlowHandlerId?: number;
  flowCommandId?: number;
}
