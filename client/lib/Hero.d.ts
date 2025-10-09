import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import SuperDocument from '@ulixee/awaited-dom/impl/super-klasses/SuperDocument';
import IDomStorage from '@ulixee/unblocked-specification/agent/browser/IDomStorage';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import { IRequestInit } from '@ulixee/awaited-dom/base/interfaces/official';
import Response from '@ulixee/awaited-dom/impl/official-klasses/Response';
import { ISuperElement, ISuperNode, ISuperNodeList } from '@ulixee/awaited-dom/base/interfaces/super';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import { ILoadStatus, ILocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import Request from '@ulixee/awaited-dom/impl/official-klasses/Request';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import { IElementIsolate, IHTMLFrameElementIsolate, IHTMLIFrameElementIsolate, IHTMLObjectElementIsolate, INodeIsolate } from '@ulixee/awaited-dom/base/interfaces/isolate';
import CSSStyleDeclaration from '@ulixee/awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import IScreenshotOptions from '@ulixee/unblocked-specification/agent/browser/IScreenshotOptions';
import { INodeVisibility } from '@ulixee/js-path';
import IClientPlugin, { IClientPluginClass } from '@ulixee/hero-interfaces/IClientPlugin';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';
import { IPluginClass } from '@ulixee/hero-interfaces/IPlugin';
import { IElementInteractVerification, IMousePositionXY } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IDomState, { IDomStateAllFn } from '@ulixee/hero-interfaces/IDomState';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import DetachedElement from './DetachedElement';
import DetachedResource from './DetachedResource';
import WebsocketResource from './WebsocketResource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import Resource from './Resource';
import IInteractions, { ITypeInteraction } from '../interfaces/IInteractions';
import Tab from './Tab';
import IHeroCreateOptions from '../interfaces/IHeroCreateOptions';
import AwaitedEventTarget from './AwaitedEventTarget';
import IHeroDefaults from '../interfaces/IHeroDefaults';
import FrameEnvironment from './FrameEnvironment';
import FileChooser from './FileChooser';
import DomState from './DomState';
import CoreSession from './CoreSession';
import { InternalPropertiesSymbol } from './internal';
import IWaitForResourcesFilter from '../interfaces/IWaitForResourcesFilter';
import DetachedElements from './DetachedElements';
import DetachedResources from './DetachedResources';
import { IDomExtensionClass } from './DomExtender';
export type ISessionOptions = ISessionCreateOptions & Pick<IHeroCreateOptions, 'connectionToCore'>;
interface ISharedInternalProperties {
    clientPlugins: IClientPlugin[];
    coreSessionPromise: Promise<CoreSession>;
    isConnected: boolean;
}
interface IHeroEvents {
    close: () => void;
    connected: () => void;
    command: (name: string, commandId: number, args: any[]) => void;
}
export default class Hero extends AwaitedEventTarget<IHeroEvents> {
    #private;
    static defaults: IHeroDefaults;
    get [InternalPropertiesSymbol](): ISharedInternalProperties;
    constructor(createOptions?: IHeroCreateOptions);
    get activeTab(): Tab;
    get document(): SuperDocument;
    get frameEnvironments(): Promise<FrameEnvironment[]>;
    get isAllContentLoaded(): Promise<boolean>;
    get isDomContentLoaded(): Promise<boolean>;
    get isPaintingStable(): Promise<boolean>;
    get lastCommandId(): Promise<number>;
    get mainFrameEnvironment(): FrameEnvironment;
    get sessionId(): Promise<string>;
    get sessionName(): Promise<string>;
    get meta(): Promise<IHeroMeta>;
    get storage(): Promise<IDomStorage>;
    get tabs(): Promise<Tab[]>;
    get url(): Promise<string>;
    get coreHost(): Promise<string>;
    get Request(): typeof Request;
    get version(): string;
    get detachedElements(): DetachedElements;
    get detachedResources(): DetachedResources;
    addToDetached(name: string, elementOrResource: Resource | WebsocketResource | IDomExtensionClass): Promise<void>;
    detach(elementOrResource: Resource | WebsocketResource): Promise<DetachedResource>;
    detach(elementOrResource: Resource | WebsocketResource): Promise<DetachedElement>;
    close(): Promise<void>;
    newTab(): Promise<Tab>;
    closeTab(tab: Tab): Promise<void>;
    focusTab(tab: Tab): Promise<void>;
    findResource(filter: IResourceFilterProperties, options?: {
        sinceCommandId: number;
    }): Promise<Resource>;
    findResources(filter: IResourceFilterProperties, options?: {
        sinceCommandId: number;
    }): Promise<Resource[]>;
    getSnippet<T = any>(key: string): Promise<T>;
    setSnippet(key: string, value: any): Promise<void>;
    waitForNewTab(options?: IWaitForOptions): Promise<Tab>;
    click(mousePosition: IMousePositionXY | ISuperElement, options?: {
        clickVerification?: IElementInteractVerification;
    }): Promise<void>;
    getFrameEnvironment(frameElement: IHTMLFrameElementIsolate | IHTMLIFrameElementIsolate | IHTMLObjectElementIsolate): Promise<FrameEnvironment | null>;
    interact(...interactions: IInteractions): Promise<void>;
    scrollTo(mousePosition: IMousePositionXY | ISuperElement): Promise<void>;
    type(...typeInteractions: ITypeInteraction[]): Promise<void>;
    exportUserProfile(): Promise<IUserProfile>;
    use(PluginObject: string | IClientPluginClass | {
        [name: string]: IPluginClass;
    }): void;
    goto(href: string, options?: {
        timeoutMs?: number;
        referrer?: string;
    }): Promise<Resource>;
    goBack(options?: {
        timeoutMs?: number;
    }): Promise<string>;
    goForward(options?: {
        timeoutMs?: number;
    }): Promise<string>;
    reload(options?: {
        timeoutMs?: number;
    }): Promise<Resource>;
    fetch(request: Request | string, init?: IRequestInit): Promise<Response>;
    getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration;
    getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility>;
    getJsValue<T>(path: string): Promise<T>;
    isElementVisible(element: IElementIsolate): Promise<boolean>;
    pause(): Promise<void>;
    querySelector(selector: string): ISuperNode;
    querySelectorAll(selector: string): ISuperNodeList;
    xpathSelector(xpath: string, orderedNodeResults?: boolean): ISuperNode;
    xpathSelectorAll(xpath: string, orderedNodeResults?: boolean): Promise<ISuperNode[]>;
    takeScreenshot(options?: IScreenshotOptions): Promise<Buffer>;
    waitForPaintingStable(options?: IWaitForOptions): Promise<void>;
    waitForResource(filter: IWaitForResourceFilter, options?: IWaitForResourceOptions): Promise<Resource | WebsocketResource>;
    waitForResources(filter: IWaitForResourcesFilter, options?: IWaitForResourceOptions): Promise<(Resource | WebsocketResource)[]>;
    waitForElement(element: ISuperElement, options?: IWaitForElementOptions): Promise<ISuperElement | null>;
    waitForFileChooser(options?: IWaitForOptions): Promise<FileChooser>;
    waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<Resource>;
    waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<void>;
    waitForMillis(millis: number): Promise<void>;
    waitForState(state: IDomState | DomState | IDomStateAllFn, options?: Pick<IWaitForOptions, 'timeoutMs'>): Promise<void>;
    validateState(state: IDomState | DomState | IDomStateAllFn): Promise<boolean>;
    flowCommand(commandFn: () => Promise<void>, optionsOrExitState?: IDomStateAllFn | IFlowCommandOptions): Promise<void>;
    registerFlowHandler(name: string, state: IDomState | DomState | IDomStateAllFn, handlerCallbackFn: (error?: Error) => Promise<any>): Promise<void>;
    triggerFlowHandlers(): Promise<{
        triggeredFlowHandler?: string;
        matchedFlowHandlers: string[];
    }>;
    toJSON(): any;
    addEventListener<K extends keyof IHeroEvents>(eventType: K, listenerFn: IHeroEvents[K] & Function, options?: any): Promise<void>;
    on<K extends keyof IHeroEvents>(eventType: K, listenerFn: IHeroEvents[K] & Function, options?: any): Promise<void>;
    once<K extends keyof IHeroEvents>(eventType: K, listenerFn: IHeroEvents[K] & Function, options?: any): Promise<void>;
    off<K extends keyof IHeroEvents>(eventType: K, listenerFn: IHeroEvents[K] & Function): Promise<void>;
    removeEventListener<K extends keyof IHeroEvents>(eventType: K, listenerFn: IHeroEvents[K] & Function): Promise<void>;
    connect(): Promise<void>;
}
export {};
