export default interface ICommandResult {
  commandId: number;
  duration: number;
  isError: boolean;
  result: any;
  resultNodeIds?: number[];
  resultNodeType?: string;
  failedJsPathStepIndex?: number;
  failedJsPathStep?: string;
}
