export default class ProtocolError extends Error {
  public remoteError: { message: string; data: any; code?: number };
  public method: string;
  constructor(
    stack: string,
    method: string,
    remoteError: { message: string; data: any; code?: number },
  ) {
    let message = `${method}: ${remoteError.message}`;
    if ('data' in remoteError) {
      if (typeof remoteError.data === 'string') {
        message += ` ${remoteError.data}`;
      } else {
        message += ` ${JSON.stringify(remoteError.data)}`;
      }
    }
    super(message);
    this.name = 'ProtocolError';
    this.method = method;
    this.stack = stack;
    this.remoteError = remoteError;
  }
}
