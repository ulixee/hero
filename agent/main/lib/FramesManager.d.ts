import Protocol from 'devtools-protocol';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IFrameManagerEvents } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import { TNewDocumentCallbackFn } from '@ulixee/unblocked-specification/agent/browser/IPage';
import DevtoolsSession from './DevtoolsSession';
import Frame from './Frame';
import Page from './Page';
import TargetInfo = Protocol.Target.TargetInfo;
export declare const DEFAULT_PAGE = "about:blank";
export declare const ISOLATED_WORLD = "__agent_world__";
export default class FramesManager extends TypedEventEmitter<IFrameManagerEvents> {
    readonly framesById: Map<string, Frame>;
    readonly framesByFrameId: Map<number, Frame>;
    readonly page: Page;
    readonly pendingNewDocumentScripts: {
        script: string;
        isolated: boolean;
    }[];
    mainFrameId: string;
    get main(): Frame;
    get activeFrames(): Frame[];
    devtoolsSession: DevtoolsSession;
    protected readonly logger: IBoundLog;
    private onFrameCreatedResourceEventsByFrameId;
    private get resources();
    private attachedFrameIds;
    private readonly events;
    private readonly networkManager;
    private readonly domStorageTracker;
    private pageCallbacks;
    private console;
    private isReady;
    constructor(page: Page, devtoolsSession: DevtoolsSession);
    initialize(devtoolsSession: DevtoolsSession): Promise<void>;
    reset(): void;
    close(error?: Error): void;
    addNewDocumentScript(script: string, installInIsolatedScope?: boolean, callbacks?: {
        [name: string]: TNewDocumentCallbackFn | null;
    }, devtoolsSession?: DevtoolsSession): Promise<{
        identifier: string;
    }>;
    checkForResolvedNavigation(browserRequestId: string, resource: IResourceMeta, error?: Error): boolean;
    frameWithPendingNavigation(browserRequestId: string, requestedUrl: string, finalUrl: string): Frame | null;
    clearChildFrames(): void;
    onFrameTargetAttached(devtoolsSession: DevtoolsSession, target: TargetInfo): Promise<void>;
    getSecurityOrigins(): {
        origin: string;
        frameId: string;
    }[];
    waitForFrame(frameDetails: {
        frameId: string;
        loaderId?: string;
    }, url: string, isInitiatingNavigation?: boolean): Promise<void>;
    getDefaultContextIdForFrameId(opts: {
        frameId: string;
        devtoolsSession?: DevtoolsSession;
        refresh?: boolean;
    }): Promise<number | undefined>;
    private onFrameNavigated;
    private onFrameStoppedLoading;
    private onFrameRequestedNavigation;
    private onFrameNavigatedWithinDocument;
    private onFrameDetached;
    private onFrameAttached;
    private onLifecycleEvent;
    private onDomPaintEvent;
    private recurseFrameTree;
    private recordFrame;
    private replayMissedResourceEventsAfterFrameAttached;
    private getFrameForEventOrQueueForReady;
    private onResourceWillBeRequested;
    private onResourceWasRequested;
    private onResourceLoaded;
    private onResourceFailed;
    private onNavigationResourceResponse;
    private onCallbackReceived;
}
