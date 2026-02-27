import Resolvable from '@ulixee/commons/lib/Resolvable';
import IConnectionTransport from '../interfaces/IConnectionTransport';
export declare class WebsocketTransport implements IConnectionTransport {
    get url(): string;
    onMessageFn: (message: string) => void;
    readonly onCloseFns: (() => void)[];
    connectedPromise: Resolvable<void>;
    isClosed: boolean;
    private events;
    private webSocket?;
    constructor(urlPromise: Promise<string>);
    send(message: string): boolean;
    close(): void;
    private onClosed;
    private onMessage;
    private connect;
}
