import { ISuperElement, ISuperNode, ISuperNodeList } from '@ulixee/awaited-dom/base/interfaces/super';
import { IRequestInit } from '@ulixee/awaited-dom/base/interfaces/official';
import SuperDocument from '@ulixee/awaited-dom/impl/super-klasses/SuperDocument';
import Storage from '@ulixee/awaited-dom/impl/official-klasses/Storage';
import CSSStyleDeclaration from '@ulixee/awaited-dom/impl/official-klasses/CSSStyleDeclaration';
import Request from '@ulixee/awaited-dom/impl/official-klasses/Request';
import { ILoadStatus, ILocationTrigger } from '@ulixee/unblocked-specification/agent/browser/Location';
import IWaitForResourceOptions from '@ulixee/hero-interfaces/IWaitForResourceOptions';
import IWaitForElementOptions from '@ulixee/hero-interfaces/IWaitForElementOptions';
import Response from '@ulixee/awaited-dom/impl/official-klasses/Response';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import { IElementIsolate, IHTMLFrameElementIsolate, IHTMLIFrameElementIsolate, IHTMLObjectElementIsolate, INodeIsolate } from '@ulixee/awaited-dom/base/interfaces/isolate';
import IScreenshotOptions from '@ulixee/unblocked-specification/agent/browser/IScreenshotOptions';
import { INodeVisibility } from '@ulixee/js-path';
import IResourceFilterProperties from '@ulixee/hero-interfaces/IResourceFilterProperties';
import IDomState, { IDomStateAllFn } from '@ulixee/hero-interfaces/IDomState';
import IFlowCommandOptions from '@ulixee/hero-interfaces/IFlowCommandOptions';
import CoreTab from './CoreTab';
import Resource from './Resource';
import IWaitForResourceFilter from '../interfaces/IWaitForResourceFilter';
import WebsocketResource from './WebsocketResource';
import AwaitedEventTarget from './AwaitedEventTarget';
import CookieStorage from './CookieStorage';
import Hero from './Hero';
import FrameEnvironment from './FrameEnvironment';
import Dialog from './Dialog';
import FileChooser from './FileChooser';
import DomState from './DomState';
import { InternalPropertiesSymbol } from './internal';
import IWaitForResourcesFilter from '../interfaces/IWaitForResourcesFilter';
import CallsiteLocator from './CallsiteLocator';
interface ISharedInternalProperties {
    coreTabPromise: Promise<CoreTab>;
}
interface IEventType {
    resource: (resource: Resource | WebsocketResource) => void;
    dialog: (dialog: Dialog) => void;
}
export default class Tab extends AwaitedEventTarget<IEventType> {
    #private;
    get [InternalPropertiesSymbol](): ISharedInternalProperties;
    constructor(hero: Hero, coreTabPromise: Promise<CoreTab>, callsiteLocator: CallsiteLocator);
    get tabId(): Promise<number>;
    get lastCommandId(): Promise<number>;
    get url(): Promise<string>;
    get isPaintingStable(): Promise<boolean>;
    get isDomContentLoaded(): Promise<boolean>;
    get isAllContentLoaded(): Promise<boolean>;
    get mainFrameEnvironment(): FrameEnvironment;
    get cookieStorage(): CookieStorage;
    get frameEnvironments(): Promise<FrameEnvironment[]>;
    get document(): SuperDocument;
    get localStorage(): Storage;
    get sessionStorage(): Storage;
    get Request(): typeof Request;
    findResource(filter: IResourceFilterProperties, options?: {
        sinceCommandId: number;
    }): Promise<Resource>;
    findResources(filter: IResourceFilterProperties, options?: {
        sinceCommandId: number;
    }): Promise<Resource[]>;
    fetch(request: Request | string, init?: IRequestInit): Promise<Response>;
    getFrameEnvironment(element: IHTMLFrameElementIsolate | IHTMLIFrameElementIsolate | IHTMLObjectElementIsolate): Promise<FrameEnvironment | null>;
    getComputedStyle(element: IElementIsolate, pseudoElement?: string): CSSStyleDeclaration;
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
    getJsValue<T>(path: string): Promise<T>;
    isElementVisible(element: IElementIsolate): Promise<boolean>;
    getComputedVisibility(node: INodeIsolate): Promise<INodeVisibility>;
    querySelector(selector: string): ISuperNode;
    querySelectorAll(selector: string): ISuperNodeList;
    xpathSelector(xpath: string, orderedNodeResults?: boolean): ISuperNode;
    xpathSelectorAll(xpath: string, orderedNodeResults?: boolean): Promise<ISuperNode[]>;
    takeScreenshot(options?: IScreenshotOptions): Promise<Buffer>;
    waitForFileChooser(options?: IWaitForOptions): Promise<FileChooser>;
    waitForPaintingStable(options?: IWaitForOptions): Promise<void>;
    waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<void>;
    waitForState(state: IDomState | DomState | IDomStateAllFn, options?: Pick<IWaitForOptions, 'timeoutMs'>): Promise<void>;
    validateState(state: IDomState | DomState | IDomStateAllFn): Promise<boolean>;
    registerFlowHandler(name: string, state: IDomState | DomState | IDomStateAllFn, handlerFn: (error?: Error) => Promise<any>): Promise<void>;
    triggerFlowHandlers(): Promise<{
        triggeredFlowHandler?: string;
        matchedFlowHandlers: string[];
    }>;
    flowCommand<T = void>(commandFn: () => Promise<T>, optionsOrExitState?: IDomStateAllFn | IFlowCommandOptions): Promise<T>;
    waitForResource(filter: IWaitForResourceFilter, options?: IWaitForResourceOptions): Promise<Resource | WebsocketResource>;
    waitForResources(filter: IWaitForResourcesFilter, options?: IWaitForResourceOptions): Promise<(Resource | WebsocketResource)[]>;
    waitForElement(element: ISuperElement, options?: IWaitForElementOptions): Promise<ISuperElement>;
    waitForLocation(trigger: ILocationTrigger, options?: IWaitForOptions): Promise<Resource>;
    waitForMillis(millis: number): Promise<void>;
    focus(): Promise<void>;
    close(): Promise<void>;
    toJSON(): any;
}
export declare function getCoreTab(tab: Tab): Promise<CoreTab>;
export declare function createTab(hero: Hero, coreTab: Promise<CoreTab>, callsiteLocator: CallsiteLocator): Tab;
export {};
