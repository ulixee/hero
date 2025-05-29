import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import MitmSocket from '..';
import BaseIpcHandler, { IGoIpcOpts } from './BaseIpcHandler';
export default class MitmSocketSession extends BaseIpcHandler {
    protected logger: IBoundLog;
    private readonly socketsById;
    constructor(logger: IBoundLog, options: IGoIpcOpts);
    requestSocket(socket: MitmSocket): Promise<void>;
    protected onMessage(rawMessage: string): void;
    protected beforeExit(): void;
}
