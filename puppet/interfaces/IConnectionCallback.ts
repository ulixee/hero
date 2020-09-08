export interface IConnectionCallback {
  resolve: Function;
  reject: Function;
  error: Error;
  method: string;
}
