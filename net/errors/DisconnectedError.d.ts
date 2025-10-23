import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
export default class DisconnectedError extends CanceledPromiseError {
    readonly host: string;
    code: string;
    constructor(host: string, message?: string);
}
