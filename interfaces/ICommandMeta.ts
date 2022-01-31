export default interface ICommandMeta {
  id: number;
  tabId: number;
  frameId: number;
  name: string;
  wasPrefetched?: boolean;
  retryNumber: number;
  args?: string;
  clientStartDate?: number;
  clientSendDate?: number;
  runStartDate: number;
  endDate?: number;
  result?: any;
  resultType?: string;
  run: number;
  callsite?: string;
  reusedCommandFromRun?: number;
  startNavigationId?: number;
  endNavigationId?: number;
  activeFlowHandlerId?: number;
}
