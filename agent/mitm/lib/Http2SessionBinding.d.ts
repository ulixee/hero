import { Http2Session } from 'http2';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { IEventSubscriber } from '@ulixee/commons/interfaces/IRegisteredEventListener';
export default class Http2SessionBinding {
    readonly clientSession: Http2Session;
    readonly serverSession: Http2Session;
    readonly events: IEventSubscriber;
    private logger;
    constructor(clientSession: Http2Session, serverSession: Http2Session, events: IEventSubscriber, logger: IBoundLog, logData: any);
    private bind;
    private pingServer;
    private onServerClose;
    private onServerError;
    private onServerGoaway;
}
