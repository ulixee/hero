export default interface ICommandWithResult {
  id: number;
  frameId: number;
  label: string;
  name: string;
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
