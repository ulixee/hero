import { IPathStep } from '@secret-agent/injected-scripts/scripts/jsPath';

export default class DomEnvError extends Error {
  private readonly pathState: { step: IPathStep; index: number };
  constructor(message: string, pathState: { step: IPathStep; index: number }) {
    super(message);
    this.pathState = pathState;
  }

  public toJSON() {
    return {
      message: this.message,
      pathState: this.pathState,
    };
  }
}
