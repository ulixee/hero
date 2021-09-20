import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';

export default interface ICommandWithResult extends ICommandMeta {
  label: string;
  startDate: number;
  duration: number;
  isError: boolean;
  frameIdPath?: string;
  resultNodeIds?: number[];
  resultNodeType?: string;
  failedJsPathStepIndex?: number;
  failedJsPathStep?: string;
}
