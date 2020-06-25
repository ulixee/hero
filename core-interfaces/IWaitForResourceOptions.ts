export default interface IWaitForResourceOptions {
  timeoutMs?: number;
  throwIfTimeout?: boolean;
  sinceCommandId?: number;
}
