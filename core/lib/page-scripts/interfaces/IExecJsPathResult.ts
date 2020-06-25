import IAttachedState from './IAttachedStateCopy';

export default interface IExecJsPathResult<T = any> {
  value: T;
  attachedState?: IAttachedState;
}
