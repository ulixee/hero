import Log from '@ulixee/commons/lib/Logger';
import {
  ILoadStatus,
  ILocationTrigger,
  LoadStatus,
} from '@ulixee/unblocked-specification/agent/browser/Location';
import { IJsPath, INodePointer } from '@ulixee/js-path';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { ICookie } from '@ulixee/unblocked-specification/agent/net/ICookie';
import {
  IInteractionGroups,
  IInteractionStep,
} from '@ulixee/unblocked-specification/agent/interact/IInteractions';
import { URL } from 'url';
import * as Fs from 'fs';
import IExecJsPathResult from '@ulixee/unblocked-specification/agent/browser/IExecJsPathResult';
import { IRequestInit } from '@ulixee/awaited-dom/base/interfaces/official';
import { IFrameEvents } from '@ulixee/unblocked-specification/agent/browser/IFrame';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import ISetCookieOptions from '@ulixee/hero-interfaces/ISetCookieOptions';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IFrameMeta from '@ulixee/hero-interfaces/IFrameMeta';
import * as Os from 'os';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import IDomStateAssertionBatch from '@ulixee/hero-interfaces/IDomStateAssertionBatch';
import IDetachedElement from '@ulixee/hero-interfaces/IDetachedElement';
import { IFrameNavigationEvents } from '@ulixee/unblocked-specification/agent/browser/IFrameNavigations';
import { ISerializable } from '@ulixee/unblocked-agent/lib/JsPath';
import Frame from '@ulixee/unblocked-agent/lib/Frame';
import FrameNavigations from '@ulixee/unblocked-agent/lib/FrameNavigations';
import IResourceMeta from '@ulixee/unblocked-specification/agent/net/IResourceMeta';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import Session from './Session';
import Tab, { ITabEventParams } from './Tab';
import CommandRecorder from './CommandRecorder';
import InjectedScripts from './InjectedScripts';
import { PageRecorderResultSet } from '../injected-scripts/pageEventsRecorder';
import { ICommandableTarget } from './CommandRunner';
import { IRemoteEmitFn, IRemoteEventListener } from '../interfaces/IRemoteEventListener';

const { log } = Log(module);

export default class FrameEnvironment
  extends TypedEventEmitter<{ paint: void }>
  implements ICommandableTarget, IRemoteEventListener
{
  public get session(): Session {
    return this.tab.session;
  }

  public get devtoolsFrameId(): string {
    return this.frame.id;
  }

  public get parentId(): number {
    return this.parentFrame?.id;
  }

  public get parentFrame(): FrameEnvironment | null {
    if (this.frame.parentId) {
      return this.tab.frameEnvironmentsByDevtoolsId.get(this.frame.parentId);
    }
    return null;
  }

  public get isAttached(): boolean {
    return this.frame.isAttached;
  }

  public get securityOrigin(): string {
    return this.frame.securityOrigin;
  }

  public get childFrameEnvironments(): FrameEnvironment[] {
    return [...this.tab.frameEnvironmentsById.values()].filter(
      x => x.frame.parentId === this.devtoolsFrameId && this.isAttached,
    );
  }

  public get isMainFrame(): boolean {
    return !this.frame.parentId;
  }

  public get navigations(): FrameNavigations {
    return this.frame.navigations;
  }

  public get id(): number {
    return this.frame.frameId;
  }

  public readonly tab: Tab;
  public readonly createdTime: Date;
  public readonly createdAtCommandId: number;
  public frame: Frame;
  public isReady: Promise<Error | void>;
  public domNodeId: number;

  protected readonly logger: IBoundLog;

  private events = new EventSubscriber();

  private isClosing = false;
  private readonly commandRecorder: CommandRecorder;
  private readonly filePathsToClean: string[] = [];
  private lastDomChangeDocumentNavigationId: number;
  private lastDomChangeTimestamp = 0;
  private isTrackingMouse = false;

  private flushPageEventsRecorderResolvers = new Map<string, Resolvable<void>>();

  private readonly installedDomAssertions = new Set<string>();

  public get url(): string {
    return this.navigations.currentUrl;
  }

  constructor(tab: Tab, frame: Frame) {
    super();
    this.frame = frame;
    this.tab = tab;
    this.createdTime = new Date();
    this.logger = log.createChild(module, {
      tabId: tab.id,
      sessionId: tab.session.id,
      frameId: this.id,
    });
    this.createdAtCommandId = this.session.commands.lastId;
    if (this.session.options.showChromeInteractions) {
      frame.interactor.beforeEachInteractionStep = this.beforeEachInteractionStep.bind(this);
      frame.interactor.afterInteractionGroups = this.afterInteractionGroups.bind(this);
    }
    frame.interactor.afterEachInteractionStep = this.afterEachInteractionStep.bind(this);

    // give tab time to setup
    process.nextTick(() => this.listen());
    this.commandRecorder = new CommandRecorder(this, tab.session, tab.id, this.id, [
      this.createRequest,
      this.detachElement,
      this.execJsPath,
      this.fetch,
      this.meta,
      this.getChildFrameEnvironment,
      this.getCookies,
      this.getJsValue,
      this.getUrl,
      this.isAllContentLoaded,
      this.isDomContentLoaded,
      this.isPaintingStable,
      this.interact,
      this.removeCookie,
      this.setCookie,
      this.setFileInputFiles,
      this.runPluginCommand,
      this.waitForLoad,
      this.waitForLocation,
      this.addRemoteEventListener,
      this.removeRemoteEventListener,
      // DO NOT ADD waitForReady
    ]);
    // don't let this explode
    this.isReady = this.install().catch(err => err);
  }

  public isAllowedCommand(method: string): boolean {
    return this.commandRecorder.fnNames.has(method) || method === 'close';
  }

  public close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    const parentLogId = this.logger.stats('FrameEnvironment.Closing');

    try {
      this.frame.close();
      this.logger.stats('FrameEnvironment.Closed', { parentLogId });
      for (const path of this.filePathsToClean) {
        Fs.promises.unlink(path).catch(() => null);
      }
      this.events.close();
      this.commandRecorder.cleanup();
    } catch (error) {
      if (!error.message.includes('Target closed') && !(error instanceof CanceledPromiseError)) {
        this.logger.error('FrameEnvironment.ClosingError', { error, parentLogId });
      }
    }
  }

  public setInteractionDisplay(
    followMouseMoves: boolean,
    hideMouse = false,
    hideHighlightedNodes = false,
  ): void {
    if (this.isTrackingMouse === followMouseMoves) return;
    this.isTrackingMouse = followMouseMoves;
    this.frame
      .evaluate(
        `window.setInteractionDisplay(${followMouseMoves}, ${hideMouse}, ${hideHighlightedNodes})`,
      )
      .catch(() => null);
  }

  public afterInteractionGroups(): Promise<void> {
    this.tab.mainFrameEnvironment.setInteractionDisplay(false);
    return Promise.resolve();
  }

  public afterEachInteractionStep(interaction: IInteractionStep, startTime: number): Promise<void> {
    this.session.db.interactions.insert(
      this.tab.id,
      this.id,
      this.session.commands.lastId,
      interaction,
      startTime,
      Date.now(),
    );
    return Promise.resolve();
  }

  public async beforeEachInteractionStep(
    interaction: IInteractionStep,
    isMouseCommand: boolean,
  ): Promise<void> {
    if (this.tab.isClosing) {
      throw new CanceledPromiseError('Canceling interaction - tab closing');
    }

    await this.tab.session.commands.waitForCommandLock();

    if (isMouseCommand) {
      this.tab.mainFrameEnvironment.setInteractionDisplay(true);
    }
  }

  /////// COMMANDS /////////////////////////////////////////////////////////////////////////////////////////////////////

  public async interact(...interactionGroups: IInteractionGroups): Promise<void> {
    await this.frame.interact(...interactionGroups);
  }

  public async getJsValue<T>(expression: string): Promise<T> {
    return await this.frame.evaluate<T>(expression, { isolateFromWebPageEnvironment: false });
  }

  public async execJsPath<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>> {
    return await this.frame.jsPath.exec(jsPath);
  }

  public meta(): Promise<IFrameMeta> {
    return Promise.resolve(this.toJSON());
  }

  public async detachElement(
    name: string,
    jsPath: IJsPath,
    timestamp: number,
    waitForElement = false,
    saveToDb = true,
  ): Promise<IDetachedElement[]> {
    const { nodePointer } = await this.frame.jsPath.getNodePointer(jsPath);
    await this.flushPageEventsRecorder();
    const navigation = this.navigations.lastHttpNavigationRequest;
    const commandId = this.session.commands.lastId;
    const domChangesTimestamp = this.lastDomChangeTimestamp;

    const elements: IDetachedElement[] = [];
    if (nodePointer.iterableItems && nodePointer.iterableIsNodePointers) {
      for (const item of nodePointer.iterableItems as INodePointer[]) {
        elements.push({
          name,
          nodePath: this.frame.jsPath.getSourceJsPath(item),
          documentUrl: this.url,
          nodePointerId: item.id,
          frameId: this.id,
          tabId: this.tab.id,
          nodeType: item.type,
          nodePreview: item.preview,
          frameNavigationId: navigation.id,
          commandId,
          domChangesTimestamp,
          timestamp,
        });
      }
    } else if (!nodePointer.iterableItems) {
      elements.push({
        name,
        nodePointerId: nodePointer.id,
        nodePath: this.frame.jsPath.getSourceJsPath(nodePointer),
        documentUrl: this.url,
        frameId: this.id,
        tabId: this.tab.id,
        nodeType: nodePointer.type,
        nodePreview: nodePointer.preview,
        frameNavigationId: navigation.id,
        commandId,
        domChangesTimestamp,
        timestamp,
      });
    }

    const promises: Promise<any>[] = [];
    for (const element of elements) {
      const elementHtmlPromise = this.tab.onElementRequested(element, saveToDb);
      if (waitForElement) {
        promises.push(elementHtmlPromise);
      }
    }
    return waitForElement ? await Promise.all(promises) : elements;
  }

  public async createRequest(input: string | number, init?: IRequestInit): Promise<INodePointer> {
    if (!this.navigations.top && !this.url) {
      throw new Error(
        'You need to use a "goto" before attempting to fetch. The in-browser fetch needs an origin to function properly.',
      );
    }
    await this.frame.waitForLoad();
    return this.runIsolatedFn(
      `${InjectedScripts.Fetcher}.createRequest`,
      input,
      // @ts-ignore
      init,
    );
  }

  public async fetch(input: string | number, init?: IRequestInit): Promise<INodePointer> {
    if (!this.navigations.top && !this.url) {
      throw new Error(
        'You need to use a "goto" before attempting to fetch. The in-browser fetch needs an origin to function properly.',
      );
    }
    await this.frame.waitForLoad();
    return this.runIsolatedFn(
      `${InjectedScripts.Fetcher}.fetch`,
      input,
      // @ts-ignore
      init,
    );
  }

  public getUrl(): Promise<string> {
    return Promise.resolve(this.navigations.currentUrl || this.frame.url);
  }

  public isPaintingStable(): Promise<boolean> {
    return Promise.resolve(this.navigations.hasLoadStatus(LoadStatus.PaintingStable));
  }

  public isDomContentLoaded(): Promise<boolean> {
    return Promise.resolve(this.navigations.hasLoadStatus(LoadStatus.DomContentLoaded));
  }

  public isAllContentLoaded(): Promise<boolean> {
    return Promise.resolve(this.navigations.hasLoadStatus(LoadStatus.AllContentLoaded));
  }

  public async getCookies(): Promise<ICookie[]> {
    await this.frame.waitForLoad();
    return await this.session.browserContext.getCookies(
      new URL(this.frame.securityOrigin ?? this.frame.url),
    );
  }

  public async setCookie(
    name: string,
    value: string,
    options?: ISetCookieOptions,
  ): Promise<boolean> {
    if (!this.navigations.top && this.frame.url === 'about:blank') {
      throw new Error(`Chrome won't allow you to set cookies on a blank tab.

Hero supports two options to set cookies:
a) Goto a url first and then set cookies on the activeTab
b) Use the UserProfile feature to set cookies for 1 or more domains before they're loaded (https://ulixee.org/docs/advanced/user-profile)
      `);
    }

    await this.frame.waitForLoad();
    const url = this.navigations.currentUrl;
    await this.session.browserContext.addCookies([
      {
        name,
        value,
        url,
        ...options,
      },
    ]);
    return true;
  }

  public async removeCookie(name: string): Promise<boolean> {
    const cookies = await this.getCookies();
    for (const cookie of cookies) {
      if (name === cookie.name) {
        await this.session.browserContext.addCookies([
          {
            name,
            value: '',
            expires: 0,
            domain: cookie.domain,
          },
        ]);
        await new Promise(setImmediate);
        return true;
      }
    }
    await this.session.browserContext.addCookies([
      {
        name,
        value: '',
        expires: 0,
        url: this.frame.url,
      },
    ]);
    await new Promise(setImmediate);
    return true;
  }

  public async getChildFrameEnvironment(jsPath: IJsPath): Promise<IFrameMeta> {
    await this.frame.waitForLoad();
    const nodeId = await this.frame.jsPath.getNodePointerId(jsPath);
    if (!nodeId) return null;

    for (const frame of this.childFrameEnvironments) {
      if (!frame.isAttached) continue;

      await frame.isReady;
      if (frame.domNodeId === nodeId) {
        return frame.toJSON();
      }
    }
  }

  public async runDomAssertions(
    id: string,
    assertions: IDomStateAssertionBatch['assertions'],
  ): Promise<number> {
    if (!this.installedDomAssertions.has(id)) {
      await this.runIsolatedFn('HERO.DomAssertions.install', id, assertions);
      this.installedDomAssertions.add(id);
    }
    try {
      const { failedIndices } = await this.runIsolatedFn<{ failedIndices: Record<number, any> }>(
        'HERO.DomAssertions.run',
        id,
      );
      return Object.keys(failedIndices).length;
    } catch (error) {
      if (error instanceof CanceledPromiseError) return 0;
      if (String(error).includes('This assertion batch has not been installed')) {
        this.installedDomAssertions.delete(id);
        return this.runDomAssertions(id, assertions);
      }
      return 1;
    }
  }

  public async clearDomAssertions(id: string): Promise<void> {
    if (this.installedDomAssertions.has(id)) {
      this.installedDomAssertions.delete(id);
      await this.runIsolatedFn('HERO.DomAssertions.clear', id);
    }
  }

  public async runPluginCommand(toPluginId: string, args: any[]): Promise<any> {
    const commandMeta = {
      page: this.tab.page,
      frame: this.frame,
    };
    return await this.session.plugins.onPluginCommand(toPluginId, commandMeta, args);
  }

  public async waitForLoad(
    status: ILoadStatus,
    options: IWaitForOptions = {},
  ): Promise<INavigation> {
    await this.isReady;
    return this.frame.waitForLoad({ loadStatus: status, ...options });
  }

  public async waitForLocation(
    trigger: ILocationTrigger,
    options?: IWaitForOptions,
  ): Promise<IResourceMeta> {
    const location = await this.frame.waitForLocation(trigger, options);
    const resourceId = location.resourceId ?? (await location.resourceIdResolvable.promise);
    return this.session.resources.get(resourceId);
  }

  public async flushPageEventsRecorder(): Promise<void> {
    const id = Math.random().toString();
    const resolver = new Resolvable<void>();
    this.flushPageEventsRecorderResolvers.set(id, resolver);
    this.frame
      .evaluate<PageRecorderResultSet>(`window.flushPageRecorder('${id}')`, {
        isolateFromWebPageEnvironment: true,
      })
      .catch(() => undefined);

    return resolver.promise;
  }

  public async onShadowDomPushed(payload: string): Promise<void> {
    try {
      await this.frame.evaluate(`window.checkForShadowRoot(${payload})`, {
        isolateFromWebPageEnvironment: true,
      });
    } catch {}
  }

  public onPageRecorderEvents(results: PageRecorderResultSet): boolean {
    const [domChanges, mouseEvents, focusEvents, scrollEvents, loadEvents, id] = results;
    if (id) {
      this.flushPageEventsRecorderResolvers.get(id).resolve();
      this.flushPageEventsRecorderResolvers.delete(id);
    }
    const hasRecords = results.some(x => x.length > 0);
    if (!hasRecords) return false;

    const commands = this.session.commands;
    const tabId = this.tab.id;
    const frameId = this.id;

    this.logger.stats('FrameEnvironment.onPageEvents', {
      tabId,
      frameId,
      dom: domChanges.length,
      mouse: mouseEvents.length,
      focusEvents: focusEvents.length,
      scrollEvents: scrollEvents.length,
      loadEvents,
    });

    if (domChanges.length) {
      this.emit('paint');
    }

    let lastCommand = commands.last;
    if (!lastCommand) return; // nothing to store yet

    let documentNavigation = this.navigations.get(this.lastDomChangeDocumentNavigationId);
    const db = this.session.db;

    const records: ITabEventParams['page-events']['records'] = {
      mouseEvents: [],
      focusEvents: [],
      scrollEvents: [],
      domChanges: [],
    };
    for (const domChange of domChanges) {
      const [action, nodeData, timestamp] = domChange;
      lastCommand = commands.getCommandForTimestamp(lastCommand, timestamp);
      if (timestamp > this.lastDomChangeTimestamp) this.lastDomChangeTimestamp = timestamp;

      if (action === DomActionType.newDocument || action === DomActionType.location) {
        const url = domChange[1].textContent;
        documentNavigation = this.navigations.findMostRecentHistory(x => x.finalUrl === url);

        if (documentNavigation) {
          if (action === DomActionType.location && documentNavigation.initiatedTime < timestamp) {
            this.frame.navigations.adjustInPageLocationChangeTime(documentNavigation, timestamp);
          }
          if (
            action === DomActionType.newDocument &&
            documentNavigation.id > (this.lastDomChangeDocumentNavigationId ?? 0)
          ) {
            this.lastDomChangeDocumentNavigationId = documentNavigation.id;
          }
        }
      }

      // if this is a doctype, set into the navigation
      if (documentNavigation && action === DomActionType.added && nodeData.nodeType === 10) {
        documentNavigation.doctype = nodeData.textContent;
        db.frameNavigations.insert(documentNavigation);
      }

      const record = db.domChanges.insert(
        tabId,
        frameId,
        documentNavigation?.id,
        lastCommand.id,
        domChange,
      );
      records.domChanges.push(record);
    }

    for (const mouseEvent of mouseEvents) {
      lastCommand = commands.getCommandForTimestamp(lastCommand, mouseEvent[8]);
      const record = db.mouseEvents.insert(tabId, frameId, lastCommand.id, mouseEvent);
      records.mouseEvents.push(record);
    }

    for (const focusEvent of focusEvents) {
      lastCommand = commands.getCommandForTimestamp(lastCommand, focusEvent[3]);
      const record = db.focusEvents.insert(tabId, frameId, lastCommand.id, focusEvent);
      records.focusEvents.push(record);
    }

    for (const scrollEvent of scrollEvents) {
      lastCommand = commands.getCommandForTimestamp(lastCommand, scrollEvent[2]);
      const record = db.scrollEvents.insert(tabId, frameId, lastCommand.id, scrollEvent);
      records.scrollEvents.push(record);
    }
    this.tab.emit('page-events', { records, frame: this });
    return true;
  }

  /////// UTILITIES ////////////////////////////////////////////////////////////////////////////////////////////////////

  public toJSON(): IFrameMeta {
    return {
      id: this.id,
      parentFrameId: this.parentId,
      name: this.frame.name,
      tabId: this.tab.id,
      puppetId: this.devtoolsFrameId,
      url: this.navigations.currentUrl,
      securityOrigin: this.securityOrigin,
      sessionId: this.session.id,
      createdAtCommandId: this.createdAtCommandId,
    } as IFrameMeta;
  }

  public runIsolatedFn<T>(fnName: string, ...args: ISerializable[]): Promise<T> {
    const callFn = `${fnName}(${args
      .map(x => {
        if (!x) return 'undefined';
        return JSON.stringify(x);
      })
      .join(', ')})`;
    return this.runFn<T>(fnName, callFn);
  }

  public async setFileInputFiles(
    jsPath: IJsPath,
    files: { name: string; data: Buffer }[],
  ): Promise<void> {
    const tmpDir = await Fs.promises.mkdtemp(`${Os.tmpdir()}/hero-upload`);
    const filepaths: string[] = [];
    for (const file of files) {
      const fileName = `${tmpDir}/${file.name}`;
      filepaths.push(fileName);
      await Fs.promises.writeFile(fileName, file.data);
    }
    await this.frame.setFileInputFiles(jsPath[0] as number, filepaths);
    this.filePathsToClean.push(tmpDir);
  }

  public addRemoteEventListener(
    type: keyof FrameEnvironment['EventTypes'],
    emitFn: IRemoteEmitFn,
    jsPath?: IJsPath,
  ): Promise<{ listenerId: string }> {
    const details = this.session.commands.observeRemoteEvents(
      type,
      emitFn,
      jsPath,
      this.tab.id,
      this.id,
    );
    this.on(type, details.listenFn);
    return Promise.resolve({ listenerId: details.id });
  }

  public removeRemoteEventListener(listenerId: string): Promise<any> {
    const details = this.session.commands.getRemoteEventListener(listenerId);
    this.off(details.type as any, details.listenFn);
    return Promise.resolve();
  }

  protected async runFn<T>(fnName: string, serializedFn: string): Promise<T> {
    const result = await this.frame.evaluate<T>(serializedFn, {
      isolateFromWebPageEnvironment: true,
    });

    if ((result as any)?.error) {
      this.logger.error(fnName, { result });
      throw new Error((result as any).error as string);
    } else {
      return result as T;
    }
  }

  protected async install(): Promise<void> {
    try {
      if (!this.isMainFrame) {
        // retrieve the domNode containing this frame (note: valid id only in the containing frame)
        this.domNodeId = await this.frame.getFrameElementNodePointerId();
      }
    } catch (error) {
      // This can happen if the node goes away. Still want to record frame
      this.logger.warn('FrameCreated.getDomNodeIdError', {
        error,
        frameId: this.id,
      });
    }
    this.record();
  }

  private listen(): void {
    const frame = this.frame;
    this.events.on(frame, 'frame-navigated', this.onFrameNavigated.bind(this), true);
    this.events.on(frame.navigations, 'change', this.recordNavigationChange.bind(this));
  }

  private onFrameNavigated(event: IFrameEvents['frame-navigated']): void {
    const { navigatedInDocument } = event;
    if (!navigatedInDocument) {
      this.installedDomAssertions.clear();
    }
    this.record();
  }

  private recordNavigationChange(event: IFrameNavigationEvents['change']): void {
    this.session.db.frameNavigations.insert(event.navigation);
  }

  private record(): void {
    this.session.db.frames.insert({
      ...this.toJSON(),
      domNodeId: this.domNodeId,
      parentId: this.parentId,
      devtoolsFrameId: this.devtoolsFrameId,
      startCommandId: this.createdAtCommandId,
      createdTimestamp: this.createdTime.getTime(),
    });
  }
}
