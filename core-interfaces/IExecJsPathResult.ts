import IAttachedState from 'awaited-dom/base/IAttachedState';

export default interface IExecJsPathResult<T = any> {
  value: T;
  attachedState?: IAttachedState;
}
