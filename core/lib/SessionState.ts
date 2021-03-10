import * as fs from 'fs';
import {
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
  ISocketEvent,
} from '@secret-agent/mitm/handlers/RequestSession';
import IWebsocketMessage from '@secret-agent/core-interfaces/IWebsocketMessage';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import Log, { ILogEntry, LogEvents, loggerSessionIdNames } from '@secret-agent/commons/Logger';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import IViewport from '@secret-agent/core-interfaces/IViewport';
import INavigation from '@secret-agent/core-interfaces/INavigation';
import IScriptInstanceMeta from '@secret-agent/core-interfaces/IScriptInstanceMeta';
import IWebsocketResourceMessage from '@secret-agent/core-interfaces/IWebsocketResourceMessage';
import type { IPuppetContextEvents } from '@secret-agent/puppet-interfaces/IPuppetContext';
import ResourceState from '@secret-agent/mitm/interfaces/ResourceState';
import { IScrollEvent } from '@secret-agent/core-interfaces/IScrollEvent';
import { IFocusEvent } from '@secret-agent/core-interfaces/IFocusEvent';
import { IMouseEvent } from '@secret-agent/core-interfaces/IMouseEvent';
import { IDomChangeEvent } from '@secret-agent/core-interfaces/IDomChangeEvent';
import { ILoadEvent } from '@secret-agent/core-interfaces/ILoadEvent';
import TabNavigations from './TabNavigations';
import { IFrameRecord } from '../models/FramesTable';
import SessionsDb from '../dbs/SessionsDb';
import SessionDb from '../dbs/SessionDb';

const { log } = Log(module);

export default class SessionState {
  public static registry = new Map<string, SessionState>();
  public readonly commands: ICommandMeta[] = [];
  public get lastCommand(): ICommandMeta | undefined {
    if (this.commands.length === 0) return;
    return this.commands[this.commands.length - 1];
  }

  public readonly sessionId: string;

  public viewport: IViewport;
  public readonly navigationsByTabId: { [tabId: number]: TabNavigations } = {};
  public readonly db: SessionDb;

  private readonly sessionName: string;
  private readonly scriptInstanceMeta: IScriptInstanceMeta;
  private readonly createDate = new Date();
  private readonly frames: { [frameId: number]: IFrameRecord } = {};
  private readonly resources: IResourceMeta[] = [];
  private readonly websocketMessages: IWebsocketResourceMessage[] = [];
  private websocketListeners: {
    [resourceId: string]: ((msg: IWebsocketResourceMessage) => any)[];
  } = {};

  private readonly logger: IBoundLog;

  private readonly browserRequestIdToResources: {
    [browserRequestId: string]: { resourceId: number; url: string }[];
  } = {};

  private lastErrorTime?: Date;
  private closeDate?: Date;
  private isClosing = false;

  private websocketMessageIdCounter = 0;

  private readonly logSubscriptionId: number;

  constructor(
    sessionsDirectory: string,
    sessionId: string,
    sessionName: string | null,
    scriptInstanceMeta: IScriptInstanceMeta,
    browserEmulatorId: string,
    humanEmulatorId: string,
    hasBrowserEmulatorPolyfills: boolean,
    viewport: IViewport,
    timezoneId: string,
  ) {
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.scriptInstanceMeta = scriptInstanceMeta;
    this.viewport = viewport;
    this.logger = log.createChild(module, {
      sessionId,
    });
    SessionState.registry.set(sessionId, this);

    fs.mkdirSync(sessionsDirectory, { recursive: true });

    this.db = new SessionDb(sessionsDirectory, sessionId);

    if (scriptInstanceMeta) {
      const sessionsTable = SessionsDb.find(sessionsDirectory).sessions;
      sessionsTable.insert(
        sessionId,
        sessionName,
        this.createDate.toISOString(),
        scriptInstanceMeta.id,
        scriptInstanceMeta.entrypoint,
        scriptInstanceMeta.startDate,
      );
    }

    this.db.session.insert(
      sessionId,
      sessionName,
      browserEmulatorId,
      humanEmulatorId,
      hasBrowserEmulatorPolyfills,
      this.createDate,
      scriptInstanceMeta?.id,
      scriptInstanceMeta?.entrypoint,
      scriptInstanceMeta?.startDate,
      timezoneId,
      viewport,
    );

    loggerSessionIdNames.set(sessionId, sessionName);

    this.logSubscriptionId = LogEvents.subscribe(this.onLogEvent.bind(this));
  }

  public registerTab(tabId: number): void {
    this.navigationsByTabId[tabId] = new TabNavigations(this.db);
  }

  public async runCommand<T>(commandFn: () => Promise<T>, commandMeta: ICommandMeta): Promise<T> {
    this.commands.push(commandMeta);

    let result: T;
    try {
      commandMeta.startDate = new Date().toISOString();
      this.db.commands.insert(commandMeta);

      result = await commandFn();
      return result;
    } catch (err) {
      result = err;
      throw err;
    } finally {
      commandMeta.endDate = new Date().toISOString();
      commandMeta.result = result;
      // NOTE: second insert on purpose -- it will do an update
      this.db.commands.insert(commandMeta);
    }
  }

  public onWebsocketMessages(
    resourceId: number,
    listenerFn: (message: IWebsocketMessage) => any,
  ): void {
    if (!this.websocketListeners[resourceId]) {
      this.websocketListeners[resourceId] = [];
    }
    this.websocketListeners[resourceId].push(listenerFn);
    // push all existing
    for (const message of this.websocketMessages) {
      if (message.resourceId === resourceId) {
        listenerFn(message);
      }
    }
  }

  public stopWebsocketMessages(
    resourceId: string,
    listenerFn: (message: IWebsocketMessage) => any,
  ): void {
    const listeners = this.websocketListeners[resourceId];
    if (!listeners) return;
    const idx = listeners.indexOf(listenerFn);
    if (idx >= 0) listeners.splice(idx, 1);
  }

  public captureWebsocketMessage(event: {
    browserRequestId: string;
    isFromServer: boolean;
    message: string | Buffer;
  }): IWebsocketResourceMessage | undefined {
    const { browserRequestId, isFromServer, message } = event;
    const resources = this.browserRequestIdToResources[browserRequestId];
    if (!resources?.length) {
      this.logger.error(`CaptureWebsocketMessageError.UnregisteredResource`, {
        browserRequestId,
        message,
      });
      return;
    }

    const finalRedirect = resources[resources.length - 1];

    const resourceMessage = {
      resourceId: finalRedirect.resourceId,
      message,
      messageId: (this.websocketMessageIdCounter += 1),
      source: isFromServer ? 'server' : 'client',
    } as IWebsocketResourceMessage;

    this.websocketMessages.push(resourceMessage);
    this.db.websocketMessages.insert(this.lastCommand?.id, resourceMessage);

    const listeners = this.websocketListeners[resourceMessage.resourceId];
    if (listeners) {
      for (const listener of listeners) {
        listener(resourceMessage);
      }
    }
    return resourceMessage;
  }

  public captureResourceState(id: number, state: Map<ResourceState, Date>): void {
    this.db.resourceStates.insert(id, state);
  }

  public captureResourceFailed(
    tabId: number,
    resourceFailedEvent: IRequestSessionResponseEvent,
    error: Error,
  ): void {
    let resourceId = resourceFailedEvent.id;
    if (!resourceId) {
      const resources = this.getBrowserRequestResources(resourceFailedEvent.browserRequestId);
      resourceId = resources?.length ? resources[0].resourceId : null;
    }
    const convertedMeta = this.resourceEventToMeta(tabId, resourceFailedEvent);
    let resourceMeta = this.getResourceMeta(resourceId);
    if (!resourceMeta) {
      resourceMeta = convertedMeta;
      this.resources.push(resourceMeta);
    }
    if (convertedMeta.response) {
      resourceMeta.response ??= convertedMeta.response;
      for (const [key, value] of Object.entries(convertedMeta.response)) {
        if (value) resourceMeta.response[key] = value;
      }
    }
    this.db.resources.insert(tabId, resourceMeta, null, resourceFailedEvent, error);
    this.resolveNavigation(tabId, resourceFailedEvent.browserRequestId, resourceMeta, error);
  }

  public captureResourceError(
    tabId: number,
    resourceEvent: IRequestSessionResponseEvent,
    error: Error,
  ): void {
    const resource = this.resourceEventToMeta(tabId, resourceEvent);
    this.db.resources.insert(tabId, resource, null, resourceEvent, error);

    if (!this.resources.some(x => x.id === resourceEvent.id)) {
      this.resources.push(resource);
    }
    this.resolveNavigation(tabId, resourceEvent.browserRequestId, resource, error);
  }

  public resolveNavigation(
    tabId: number,
    browserRequestId: string,
    resource: IResourceMeta,
    error?: Error,
  ) {
    const navigations = this.navigationsByTabId[tabId];
    if (!navigations) return;

    const isNavigationToCurrentUrl =
      (resource.url === navigations.currentUrl ||
        resource.request.url === navigations.currentUrl) &&
      resource.request.method !== 'OPTIONS';

    if (isNavigationToCurrentUrl || browserRequestId === navigations.top?.browserRequestId) {
      navigations.onResourceLoaded(resource.id, resource.response?.statusCode, error);
    }
  }

  public captureResource(
    tabId: number,
    resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent,
    isResponse: boolean,
  ): IResourceMeta {
    const resource = this.resourceEventToMeta(tabId, resourceEvent);
    const resourceResponseEvent = resourceEvent as IRequestSessionResponseEvent;

    this.db.resources.insert(tabId, resource, resourceResponseEvent.body, resourceEvent);

    if (isResponse) {
      this.resolveNavigation(tabId, resourceResponseEvent.browserRequestId, resource);
      this.resources.push(resource);
    }
    return resource;
  }

  public getBrowserRequestResources(
    browserRequestId: string,
  ): { resourceId: number; url: string }[] {
    return this.browserRequestIdToResources[browserRequestId];
  }

  public resourceEventToMeta(
    tabId: number,
    resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent,
  ): IResourceMeta {
    const {
      request,
      response,
      resourceType,
      browserRequestId,
      redirectedToUrl,
    } = resourceEvent as IRequestSessionResponseEvent;

    if (browserRequestId) {
      // NOTE: browserRequestId can be shared amongst redirects
      if (!this.browserRequestIdToResources[browserRequestId]) {
        this.browserRequestIdToResources[browserRequestId] = [];
      }
      this.browserRequestIdToResources[browserRequestId].push({
        resourceId: resourceEvent.id,
        url: request.url,
      });
    }

    const resource = {
      id: resourceEvent.id,
      tabId,
      url: request.url,
      receivedAtCommandId: this.lastCommand?.id,
      type: resourceType,
      isRedirect: !!redirectedToUrl,
      request: {
        ...request,
        postData: request.postData?.toString(),
      },
    } as IResourceMeta;

    if (response?.statusCode || response?.browserServedFromCache || response?.browserLoadFailure) {
      resource.response = response;
      if (response.url) resource.url = response.url;
      else resource.response.url = request.url;
    }

    return resource;
  }

  public getResources(tabId: number): IResourceMeta[] {
    return this.resources.filter(x => x.tabId === tabId);
  }

  public getResourceData(id: number): Promise<Buffer> {
    return this.db.getResourceData(id);
  }

  public getResourceMeta(id: number): IResourceMeta {
    return this.resources.find(x => x.id === id);
  }

  ///////   FRAMES ///////

  public captureFrameCreated(
    tabId: number,
    createdFrame: Pick<IFrameRecord, 'id' | 'parentId' | 'name' | 'securityOrigin'>,
    domNodeId: number,
  ): void {
    const frame = {
      id: createdFrame.id,
      tabId,
      domNodeId,
      parentId: createdFrame.parentId,
      name: createdFrame.name,
      securityOrigin: createdFrame.securityOrigin,
      startCommandId: this.lastCommand?.id,
      createdTime: new Date().toISOString(),
    } as IFrameRecord;
    this.frames[createdFrame.id] = frame;
    this.db.frames.insert(frame);
  }

  public captureSubFrameNavigated(
    tabId: number,
    frame: Pick<IFrameRecord, 'id' | 'parentId' | 'name' | 'securityOrigin'> & {
      navigationReason?: string;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    navigatedInDocument: boolean,
  ): void {
    const existing = this.frames[frame.id];
    if (existing) {
      existing.name = frame.name;
      existing.securityOrigin = frame.securityOrigin;
      this.db.frames.insert(existing);
    }
    // TODO: capture frame navigations
  }

  public captureError(tabId: number, frameId: string, source: string, error: Error): void {
    this.logger.info('Window.error', { source, error });
    this.db.pageLogs.insert(tabId, frameId, source, error.stack || String(error), new Date());
  }

  public captureLog(
    tabId: number,
    frameId: string,
    consoleType: string,
    message: string,
    location?: string,
  ): void {
    this.logger.info('Window.console', { message });
    this.db.pageLogs.insert(tabId, frameId, consoleType, message, new Date(), location);
  }

  public onLogEvent(entry: ILogEntry): void {
    if (entry.sessionId === this.sessionId || !entry.sessionId) {
      if (entry.action === 'Window.runCommand') entry.data = { id: entry.data.id };
      if (entry.action === 'Window.ranCommand') entry.data = null;
      if (entry.level === 'error') {
        this.lastErrorTime = entry.timestamp;
      }
      this.db.sessionLogs.insert(entry);
    }
  }

  public close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.logger.stats('SessionState.Closing');
    this.closeDate = new Date();
    this.db.session.close(this.sessionId, this.closeDate);
    LogEvents.unsubscribe(this.logSubscriptionId);
    loggerSessionIdNames.delete(this.sessionId);
    this.db.flush();
    this.db.close();
    SessionState.registry.delete(this.sessionId);
  }

  public checkForResponsive(): {
    hasRecentErrors: boolean;
    lastActivityDate: Date;
    lastCommandName: string;
    closeDate: Date | null;
  } {
    let lastSuccessDate = this.createDate;
    for (const navigation of Object.values(this.navigationsByTabId)) {
      const loadTime = navigation.top?.stateChanges?.get('Load');
      const lastPageTime = loadTime ?? navigation.top?.initiatedTime;
      if (lastPageTime && lastPageTime > lastSuccessDate) {
        lastSuccessDate = lastPageTime;
      }
      for (const command of this.commands) {
        if (!command.endDate) continue;
        const endDate = new Date(command.endDate);
        if (loadTime && endDate > lastSuccessDate && !command.resultType?.includes('Error')) {
          lastSuccessDate = endDate;
        }
      }
    }

    const hasRecentErrors = this.lastErrorTime >= lastSuccessDate;

    const lastCommand = this.lastCommand;
    let lastActivityDate = lastSuccessDate ? new Date(lastSuccessDate) : null;
    let lastCommandName: string;
    if (lastCommand) {
      lastCommandName = lastCommand.name;
      const commandDate = new Date(lastCommand.endDate ?? lastCommand.startDate);
      if (commandDate > lastActivityDate) {
        lastActivityDate = commandDate;
      }
    }
    return {
      hasRecentErrors,
      lastActivityDate,
      lastCommandName,
      closeDate: this.closeDate,
    };
  }

  public getMainFrameDomChanges(
    frameLifecycles: INavigation[],
    sinceCommandId?: number,
  ): { [frameId: string]: IDomChangeEvent[] } {
    return this.db.getDomChanges(
      frameLifecycles.map(x => x.frameId),
      sinceCommandId,
    );
  }

  public onPageEvents(
    tabId: number,
    frameId: string,
    domChanges: IDomChangeEvent[],
    mouseEvents: IMouseEvent[],
    focusEvents: IFocusEvent[],
    scrollEvents: IScrollEvent[],
    loadEvents: ILoadEvent[],
  ): void {
    this.logger.stats('State.onPageEvents', {
      tabId,
      frameId,
      dom: domChanges.length,
      mouse: mouseEvents.length,
      focusEvents: focusEvents.length,
      scrollEvents: scrollEvents.length,
      loadEvents,
    });

    let startCommandId = domChanges.reduce((max, change) => {
      if (max > change[0]) return max;
      return change[0];
    }, -1);

    const navigations = this.navigationsByTabId[tabId];
    // find last page load
    for (let i = navigations.history.length - 1; i >= 0; i -= 1) {
      const page = navigations.history[i];
      if (page.stateChanges.has(LocationStatus.HttpResponded)) {
        startCommandId = page.startCommandId;
        break;
      }
    }

    for (const loadEvent of loadEvents) {
      const [, event, url, timestamp] = loadEvent;

      let incomingStatus;
      if (event === 'LargestContentfulPaint') {
        incomingStatus = 'ContentPaint';
      } else if (event === 'DOMContentLoaded') {
        incomingStatus = LocationStatus.DomContentLoaded;
      } else if (event === 'load') {
        incomingStatus = 'Load';
      }

      navigations.onLoadStateChanged(incomingStatus, url, frameId, new Date(timestamp));
    }

    for (const domChange of domChanges) {
      if (domChange[0] === -1) domChange[0] = startCommandId;
      this.db.domChanges.insert(tabId, frameId, domChange);
    }

    for (const mouseEvent of mouseEvents) {
      if (mouseEvent[0] === -1) mouseEvent[0] = startCommandId;
      this.db.mouseEvents.insert(tabId, mouseEvent);
    }

    for (const focusEvent of focusEvents) {
      if (focusEvent[0] === -1) focusEvent[0] = startCommandId;
      this.db.focusEvents.insert(tabId, focusEvent);
    }

    for (const scrollEvent of scrollEvents) {
      if (scrollEvent[0] === -1) scrollEvent[0] = startCommandId;
      this.db.scrollEvents.insert(tabId, scrollEvent);
    }
  }

  public captureDevtoolsMessage(event: IPuppetContextEvents['devtools-message']): void {
    this.db.devtoolsMessages.insert(event);
  }

  public captureTab(
    tabId: number,
    pageId: string,
    devtoolsSessionId: string,
    openerTabId?: number,
  ): void {
    this.db.tabs.insert(tabId, pageId, devtoolsSessionId, this.viewport, openerTabId);
  }

  public captureSocketEvent(socketEvent: ISocketEvent): void {
    this.db.sockets.insert(socketEvent.socket);
  }
}
