import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
export interface IWebsocketMessage {
    resourceId: number;
    messageId: number;
    timestamp: number;
    message: string | Buffer;
    source: 'server' | 'client';
}
export default class WebsocketMessages extends TypedEventEmitter<{
    new: {
        lastCommandId: number;
        message: IWebsocketMessage;
    };
}> {
    private readonly websocketMessages;
    private websocketListeners;
    private messageIdCounter;
    private logger;
    constructor(logger: IBoundLog);
    cleanup(): void;
    getMessages(resourceId: number): IWebsocketMessage[];
    listen(resourceId: number, listenerFn: (message: IWebsocketMessage) => any): void;
    unlisten(resourceId: number, listenerFn: (message: IWebsocketMessage) => any): void;
    record(event: {
        resourceId: number;
        isFromServer: boolean;
        message: string | Buffer;
        lastCommandId: number;
        timestamp: number;
    }, isMitmEnabled: boolean): IWebsocketMessage | undefined;
}
