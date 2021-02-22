import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';

export default class DisconnectedFromCoreError extends CanceledPromiseError {
  public code = 'DisconnectedFromCore';
  constructor(readonly coreHost: string) {
    super(`This Agent has been disconnected from Core (coreHost: ${coreHost})`);
  }
}
