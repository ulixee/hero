import IDomState, { IDomStateAllFn } from './IDomState';

export default interface IFlowCommandOptions {
  maxRetries?: number;
  exitState?: IDomState | IDomStateAllFn;
}
