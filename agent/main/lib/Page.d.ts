/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { IJsPath } from '@ulixee/js-path';
import IDialog from '@ulixee/unblocked-specification/agent/browser/IDialog';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import { IPage, IPageEvents, TNewDocumentCallbackFn } from '@ulixee/unblocked-specification/agent/browser/IPage';
import IScreenshotOptions from '@ulixee/unblocked-specification/agent/browser/IScreenshotOptions';
import { ILoadStatus, LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import { IElementInteractVerification, IInteractionGroup } from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import Protocol from 'devtools-protocol';
import IWaitForOptions from '../interfaces/IWaitForOptions';
import BrowserContext from './BrowserContext';
import DevtoolsSession from './DevtoolsSession';
import DomStorageTracker, { IDomStorageEvents } from './DomStorageTracker';
import Frame from './Frame';
import FramesManager from './FramesManager';
import { Keyboard } from './Keyboard';
import Mouse from './Mouse';
import NetworkManager from './NetworkManager';
import { Worker } from './Worker';
import TargetInfo = Protocol.Target.TargetInfo;
export interface IPageCreateOptions {
    groupName?: string;
    runPageScripts?: boolean;
    enableDomStorageTracker?: boolean;
    triggerPopupOnPageId?: string;
    installJsPathIntoDefaultContext?: boolean;
}
interface IPageLevelEvents extends IPageEvents, IDomStorageEvents {
    'dialog-closed': {
        wasConfirmed: boolean;
        userInput: string;
    };
}
export default class Page extends TypedEventEmitter<IPageLevelEvents> implements IPage {
    keyboard: Keyboard;
    mouse: Mouse;
    workersById: Map<string, Worker>;
    browserContext: BrowserContext;
    readonly opener: Page | null;
    networkManager: NetworkManager;
    framesManager: FramesManager;
    domStorageTracker: DomStorageTracker;
    groupName: string;
    runPageScripts: boolean;
    popupInitializeFn?: (page: Page, openParams: {
        url: string;
        windowName: string;
    }) => Promise<any>;
    devtoolsSession: DevtoolsSession;
    targetId: string;
    isClosed: boolean;
    readonly isReady: Promise<void>;
    windowOpenParams: Protocol.Page.WindowOpenEvent;
    installJsPathIntoIsolatedContext: boolean;
    readonly tabId: number;
    activeDialog: IDialog;
    get id(): string;
    get mainFrame(): Frame;
    get frames(): Frame[];
    get workers(): Worker[];
    get lastActivityId(): number;
    readonly logger: IBoundLog;
    private isClosing;
    private closePromise;
    private readonly events;
    private waitTimeouts;
    constructor(devtoolsSession: DevtoolsSession, targetId: string, browserContext: BrowserContext, logger: IBoundLog, opener: Page | null, pageOptions?: IPageCreateOptions);
    setNetworkRequestInterceptor(networkRequestsFn: (request: Protocol.Fetch.RequestPausedEvent) => Promise<Protocol.Fetch.FulfillRequestRequest>): Promise<void>;
    interact(...interactionGroups: IInteractionGroup[]): Promise<void>;
    click(jsPathOrSelector: IJsPath | string, verification?: IElementInteractVerification): Promise<void>;
    type(text: string): Promise<void>;
    addNewDocumentScript(script: string, isolatedEnvironment: boolean, callbacks?: {
        [name: string]: TNewDocumentCallbackFn | null;
    }, devtoolsSession?: DevtoolsSession): Promise<{
        identifier: string;
    }>;
    removeDocumentScript(identifier: string, devtoolsSession?: DevtoolsSession): Promise<void>;
    setJavaScriptEnabled(enabled: boolean): Promise<void>;
    evaluate<T>(expression: string, options?: {
        timeoutMs?: number;
        isolatedFromWebPageEnvironment?: boolean;
    }): Promise<T>;
    navigate(url: string, options?: {
        referrer?: string;
    }): Promise<{
        loaderId: string;
    }>;
    goto(url: string, options?: {
        timeoutMs?: number;
        referrer?: string;
    }): Promise<IResourceMeta>;
    waitForLoad(status: ILoadStatus, options?: IWaitForOptions): Promise<INavigation>;
    execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>>;
    goBack(options?: {
        timeoutMs?: number;
        waitForLoadStatus?: LoadStatus;
    }): Promise<string>;
    goForward(options?: {
        timeoutMs?: number;
        waitForLoadStatus?: LoadStatus;
    }): Promise<string>;
    reload(options?: {
        timeoutMs?: number;
    }): Promise<IResourceMeta>;
    bringToFront(): Promise<void>;
    dismissDialog(accept: boolean, promptText?: string): Promise<void>;
    screenshot(options: IScreenshotOptions): Promise<Buffer>;
    onWorkerAttached(devtoolsSession: DevtoolsSession, targetInfo: TargetInfo): Promise<Error | void>;
    reset(): Promise<void>;
    close(options?: {
        timeoutMs?: number;
    }): Promise<void>;
    onTargetKilled(errorCode: number): void;
    didClose(closeError?: Error): void;
    bindSessionEvents(session: DevtoolsSession): void;
    private cleanup;
    private navigateToHistory;
    private initialize;
    private onAttachedToTarget;
    private onTargetCrashed;
    private onWindowOpen;
    private onJavascriptDialogOpening;
    private onJavascriptDialogClosed;
    private onMainFrameNavigated;
    private onFileChooserOpened;
    private onScreencastFrame;
    private onWebsocketFrame;
}
export {};
