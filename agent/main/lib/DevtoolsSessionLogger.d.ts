import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import DevtoolsSession from './DevtoolsSession';
import BrowserContext from './BrowserContext';
interface IMessageDetails {
    sessionType: IDevtoolsLogEvents['devtools-message']['sessionType'];
    workerTargetId?: string;
    pageTargetId?: string;
    iframeTargetId?: string;
}
export default class DevtoolsSessionLogger extends TypedEventEmitter<IDevtoolsLogEvents> {
    private browserContext;
    static defaultTruncateMessageResponses: DevtoolsSessionLogger['truncateMessageResponses'];
    static defaultTruncateParams: DevtoolsSessionLogger['truncateParams'];
    readonly truncateMessageResponses: Set<string>;
    readonly truncateParams: Map<string, {
        maxLength: number;
        path: string | string[];
    }[]>;
    private logger;
    private events;
    private fetchRequestIdToNetworkId;
    private devtoolsSessions;
    private requestsToSkip;
    private browserContextInitiatedMessageIds;
    private sentMessagesById;
    constructor(browserContext: BrowserContext);
    close(): void;
    subscribeToDevtoolsMessages(devtoolsSession: DevtoolsSession, details: IMessageDetails): void;
    private onEventSend;
    private onEventReceive;
    private isOtherBrowserContextTarget;
    private filterAndSendMessage;
}
interface IDevtoolsLogEvents {
    'devtools-message': {
        direction: 'send' | 'receive';
        timestamp: Date;
        pageTargetId?: string;
        workerTargetId?: string;
        frameId?: string;
        requestId?: string;
        sessionType: 'page' | 'worker' | 'browser' | 'iframe';
        sessionId: string;
        method?: string;
        id?: number;
        params?: any;
        error?: any;
        result?: any;
    };
}
export {};
