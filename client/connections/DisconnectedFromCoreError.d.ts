import DisconnectedError from '@ulixee/net/errors/DisconnectedError';
export default class DisconnectedFromCoreError extends DisconnectedError {
    readonly coreHost: string;
    code: string;
    constructor(coreHost: string);
}
