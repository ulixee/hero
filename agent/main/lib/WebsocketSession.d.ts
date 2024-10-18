import TypedEventEmitter from '@ulixee/commons/lib/TypedEventEmitter';
import { IWebsocketEvents } from '@ulixee/unblocked-specification/agent/browser/IWebsocketSession';
export declare class WebsocketSession extends TypedEventEmitter<IWebsocketEvents> {
    readonly isReady: Promise<void>;
    private readonly host;
    private port;
    private readonly secret;
    private clientIdToTargetId;
    private server;
    private wss;
    private intervals;
    constructor();
    initialize(): Promise<void>;
    close(): void;
    isWebsocketUrl(url: string): boolean;
    registerWebsocketFrameId(url: string, frameId: string): void;
    injectWebsocketCallbackIntoScript(script: string): string;
    private handleUpgrade;
    private handleConnection;
    private handleMessage;
}
