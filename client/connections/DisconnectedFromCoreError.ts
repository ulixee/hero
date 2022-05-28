import DisconnectedError from '@ulixee/net/errors/DisconnectedError';
import { registerSerializableErrorType } from '@ulixee/commons/lib/TypeSerializer';

export default class DisconnectedFromCoreError extends DisconnectedError {
  public override code = 'DisconnectedFromCore';
  constructor(readonly coreHost: string) {
    super(`This Hero has been disconnected from Core (coreHost: ${coreHost})`);
    this.name = 'DisconnectedFromCore';
  }
}

registerSerializableErrorType(DisconnectedFromCoreError);
