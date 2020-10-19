export default class ProtocolError extends Error {
  private remoteError: { message: string; data: any };
  private method: string;
  constructor(stack: string, method: string, remoteError: { message: string; data: any }) {
    let message = `${method}: ${remoteError.message}`;
    if ('data' in remoteError) {
      if (typeof remoteError.data === 'string') {
        message += ` ${remoteError.data}`;
      } else {
        message += ` ${JSON.stringify(remoteError.data)}`;
      }
    }
    super(message);
    this.method = method;
    this.stack = stack;
    this.remoteError = remoteError;
  }
}
