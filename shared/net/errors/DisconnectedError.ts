import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { registerSerializableErrorType } from '@ulixee/commons/lib/TypeSerializer';
import addGlobalInstance from '@ulixee/commons/lib/addGlobalInstance';

export default class DisconnectedError extends CanceledPromiseError {
  public code = 'DisconnectedError';
  constructor(
    readonly host: string,
    message?: string,
  ) {
    super(message ?? `This transport has been disconnected (host: ${host})`);
    this.name = 'DisconnectedError';
  }
}

addGlobalInstance(DisconnectedError);
registerSerializableErrorType(DisconnectedError);
