export default class TimeoutError extends Error {
  constructor(message?: string) {
    super(message ?? 'Timeout waiting for promise');
  }
}
