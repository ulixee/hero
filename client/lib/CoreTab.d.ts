import IDetachedResource from '@ulixee/hero-interfaces/IDetachedResource';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IJsPath } from '@ulixee/js-path';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IScreenshotOptions from '@ulixee/unblocked-specification/agent/browser/IScreenshotOptions';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import IFileChooserPrompt from '@ulixee/unblocked-specification/agent/browser/IFileChooserPrompt';
import ISourceCodeLocation from '@ulixee/commons/interfaces/ISourceCodeLocation';
import IDomState, { IDomStateAllFn } from '@ulixee/hero-interfaces/IDomState';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import ICoreCommandRequestPayload from '@ulixee/hero-interfaces/ICoreCommandRequestPayload';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';
import CoreCommandQueue from './CoreCommandQueue';
import CoreEventHeap from './CoreEventHeap';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import IJsPathEventTarget from '../interfaces/IJsPathEventTarget';
import ConnectionToHeroCore from '../connections/ConnectionToHeroCore';
import CoreFrameEnvironment from './CoreFrameEnvironment';
import CoreSession from './CoreSession';
import IFlowHandler from '../interfaces/IFlowHandler';
import DomState from './DomState';
export default class CoreTab implements IJsPathEventTarget {
    private static waitForStateCommandPlaceholder;
    tabId: number;
    sessionId: string;
    commandQueue: CoreCommandQueue;
    eventHeap: CoreEventHeap;
    readonly coreSession: CoreSession;
    get mainFrameEnvironment(): CoreFrameEnvironment;
    frameEnvironmentsById: Map<number, CoreFrameEnvironment>;
    protected readonly meta: ISessionMeta & {
        sessionName: string;
    };
    private readonly flowCommands;
    private readonly flowHandlers;
    private readonly connection;
    private readonly mainFrameId;
    constructor(meta: ISessionMeta & {
        sessionName: string;
    }, connection: ConnectionToHeroCore, coreSession: CoreSession);
    waitForState(state: IDomState | DomState | IDomStateAllFn, options?: Pick<IWaitForOptions, 'timeoutMs'>, sourceCode?: {
        callstack: string;
        callsitePath: ISourceCodeLocation[];
    }): Promise<void>;
    validateState(state: IDomState | DomState | IDomStateAllFn, callsitePath: ISourceCodeLocation[]): Promise<boolean>;
    registerFlowHandler(name: string, state: IDomState | DomState | IDomStateAllFn, handlerFn: (error?: Error) => Promise<any>, callsitePath: ISourceCodeLocation[]): Promise<void>;
    runFlowCommand<T>(commandFn: () => Promise<T>, exitState: IDomState | DomState | IDomStateAllFn, callsitePath: ISourceCodeLocation[], options?: IFlowCommandOptions): Promise<T>;
    shouldRetryFlowHandlers(command: CoreCommandQueue['internalState']['lastCommand'], error: Error): Promise<boolean>;
    triggerFlowHandlers(): Promise<{
        triggeredFlowHandler?: IFlowHandler;
        matchedFlowHandlers: IFlowHandler[];
    }>;
    getCoreFrameEnvironments(): Promise<CoreFrameEnvironment[]>;
    getCoreFrameForMeta(frameMeta: IFrameMeta): CoreFrameEnvironment;
    getResourceProperty<T = any>(id: number, propertyPath: string): Promise<T>;
    configure(options: IConfigureSessionOptions): Promise<void>;
    detachResource(name: string, resourceId: number): Promise<IDetachedResource>;
    goto(href: string, options: {
        timeoutMs?: number;
        referrer?: string;
    }): Promise<IResourceMeta>;
    goBack(options: {
        timeoutMs?: number;
    }): Promise<string>;
    goForward(options: {
        timeoutMs?: number;
    }): Promise<string>;
    findResource(filter: IResourceFilterProperties, options?: {
        sinceCommandId?: number;
    }): Promise<IResourceMeta>;
    findResources(filter: IResourceFilterProperties, options?: {
        sinceCommandId?: number;
    }): Promise<IResourceMeta[]>;
    reload(options: {
        timeoutMs?: number;
    }): Promise<IResourceMeta>;
    exportUserProfile(): Promise<IUserProfile>;
    takeScreenshot(options: IScreenshotOptions): Promise<Buffer>;
    waitForFileChooser(options: IWaitForOptions): Promise<IFileChooserPrompt>;
    waitForResources(filter: Pick<IWaitForResourceFilter, 'url' | 'type'>, opts: IWaitForResourceOptions): Promise<IResourceMeta[]>;
    waitForMillis(millis: number): Promise<void>;
    waitForNewTab(opts: IWaitForOptions): Promise<CoreTab>;
    focusTab(): Promise<void>;
    dismissDialog(accept: boolean, promptText?: string): Promise<void>;
    addEventListener(jsPath: IJsPath | null, eventType: string, listenerFn: (...args: any[]) => void, options?: any, extras?: Partial<ICoreCommandRequestPayload>): Promise<void>;
    removeEventListener(jsPath: IJsPath | null, eventType: string, listenerFn: (...args: any[]) => void, options?: any, extras?: Partial<ICoreCommandRequestPayload>): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
