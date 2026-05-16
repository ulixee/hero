import Resolvable from '@ulixee/commons/lib/Resolvable';
import TypedEventEmitter from '@ulixee/commons/lib/TypedEventEmitter';
import DevtoolsSession from './DevtoolsSession';
import { IConsoleEvents } from '@ulixee/unblocked-specification/agent/browser/IConsole';
export declare class Console extends TypedEventEmitter<IConsoleEvents> {
    devtoolsSession: DevtoolsSession;
    secretKey: string;
    isReady: Resolvable<void>;
    private readonly events;
    private clientIdToTargetId;
    constructor(devtoolsSession: DevtoolsSession, secretKey: string);
    initialize(): Promise<void>;
    isConsoleRegisterUrl(url: string): boolean;
    registerFrameId(url: string, frameId: string): void;
    injectCallbackIntoScript(script: string): string;
    private handleConsoleMessage;
}
