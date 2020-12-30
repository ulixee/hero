import IWaitForOptions from './IWaitForOptions';

export default interface IWaitForResourceOptions extends IWaitForOptions {
  throwIfTimeout?: boolean;
}
