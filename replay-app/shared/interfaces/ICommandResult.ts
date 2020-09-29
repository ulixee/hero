export default interface ICommandWithResult {
  id: number;
  tabId: string;
  frameId: number;
  name: string;
  label: string;
  args?: string;
  startDate: string;
  endDate?: string;
  duration: number;
  isError: boolean;
  result: any;
  resultType?: string;
  resultNodeIds?: number[];
  resultNodeType?: string;
  failedJsPathStepIndex?: number;
  failedJsPathStep?: string;
}
