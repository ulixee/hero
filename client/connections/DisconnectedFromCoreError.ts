import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';

export default class DisconnectedFromCoreError extends CanceledPromiseError {
  public code = 'DisconnectedFromCore';
  constructor(readonly coreHost: string) {
    super(`This Hero has been disconnected from Core (coreHost: ${coreHost})`);
    this.name = 'DisconnectedFromCore';
  }
}
