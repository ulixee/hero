import { IPathStep } from 'awaited-dom/base/AwaitedPath';

export default class DomEnvError extends Error {
  private readonly pathState: { step: IPathStep; index: number };
  constructor(message: string, pathState: { step: IPathStep; index: number }) {
    super(message);
    this.pathState = pathState;
    this.name = 'DomEnvError';
  }

  public toJSON(): object {
    return {
      message: this.message,
      pathState: this.pathState,
    };
  }
}
