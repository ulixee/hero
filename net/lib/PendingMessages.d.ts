import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
export default class PendingMessages<IPayload> {
    private marker;
    private lastId;
    private readonly pendingRequestsById;
    private dontCancelIds;
    constructor(marker?: string);
    cancel(error: CanceledPromiseError): void;
    resolve(id: string, data: IPayload): void;
    reject(id: string, error: Error): void;
    delete(id: string): void;
    create(timeoutMs: number, dontCancelId?: boolean): {
        id: string;
        promise: Promise<IPayload>;
    };
}
