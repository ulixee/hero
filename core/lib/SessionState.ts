import * as fs from 'fs';
import {
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
  ISocketEvent,
} from '@ulixee/hero-mitm/handlers/RequestSession';
import IWebsocketMessage from '@ulixee/hero-interfaces/IWebsocketMessage';
import IResourceMeta from '@ulixee/hero-interfaces/IResourceMeta';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log, { ILogEntry, LogEvents, loggerSessionIdNames } from '@ulixee/commons/lib/Logger';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import INavigation, { LoadStatus } from '@ulixee/hero-interfaces/INavigation';
import IScriptInstanceMeta from '@ulixee/hero-interfaces/IScriptInstanceMeta';
import IWebsocketResourceMessage from '@ulixee/hero-interfaces/IWebsocketResourceMessage';
import type { IPuppetContextEvents } from '@ulixee/hero-interfaces/IPuppetContext';
import ResourceState from '@ulixee/hero-mitm/interfaces/ResourceState';
import { IScrollEvent } from '@ulixee/hero-interfaces/IScrollEvent';
import { IFocusEvent } from '@ulixee/hero-interfaces/IFocusEvent';
import { IMouseEvent } from '@ulixee/hero-interfaces/IMouseEvent';
import { IDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
import injectedSourceUrl from '@ulixee/hero-interfaces/injectedSourceUrl';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import IDeviceProfile from '@ulixee/hero-interfaces/IDeviceProfile';
import ResourcesTable from '../models/ResourcesTable';
import SessionsDb from '../dbs/SessionsDb';
import SessionDb from '../dbs/SessionDb';
import { IJsPathHistory } from './JsPath';
import FrameEnvironment from './FrameEnvironment';

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
  public readonly db: SessionDb;

  public nextCommandMeta: { commandId: number; startDate: Date; sendDate: Date };

  private readonly sessionName: string;
  private readonly scriptInstanceMeta: IScriptInstanceMeta;
  private readonly createDate = new Date();
  private readonly resourcesById = new Map<number, IResourceMeta>();
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
  private lastNavigationTime?: Date;
  private hasLoadedAnyPage = false;

  private isClosing = false;

  private websocketMessageIdCounter = 0;

  private readonly logSubscriptionId: number;

  constructor(
    sessionId: string,
    sessionName: string | null,
    scriptInstanceMeta: IScriptInstanceMeta,
    viewport: IViewport,
  ) {
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.scriptInstanceMeta = scriptInstanceMeta;
    this.viewport = viewport;
    this.logger = log.createChild(module, {
      sessionId,
    });
    SessionState.registry.set(sessionId, this);

    fs.mkdirSync(SessionDb.databaseDir, { recursive: true });
    this.db = new SessionDb(sessionId);
    if (scriptInstanceMeta) {
      fs.mkdirSync(SessionsDb.databaseDir, { recursive: true });
      const sessionsDb = SessionsDb.find();
      const sessionsTable = sessionsDb.sessions;
      sessionsTable.insert(
        sessionId,
        sessionName,
        this.createDate.getTime(),
        scriptInstanceMeta.id,
        scriptInstanceMeta.entrypoint,
        scriptInstanceMeta.startDate,
      );
    }

    loggerSessionIdNames.set(sessionId, sessionName);

    this.logSubscriptionId = LogEvents.subscribe(this.onLogEvent.bind(this));
  }

  public recordSession(options: {
    browserEmulatorId: string;
    browserVersion: string;
    humanEmulatorId: string;
    userAgentString: string;
    timezoneId?: string;
    locale?: string;
    deviceProfile?: IDeviceProfile;
    sessionOptions: ISessionCreateOptions;
  }) {
    const { sessionName, scriptInstanceMeta, ...optionsToStore } = options.sessionOptions;
    this.db.session.insert(
      this.sessionId,
      this.sessionName,
      options.browserEmulatorId,
      options.browserVersion,
      options.userAgentString,
      options.humanEmulatorId,
      this.createDate,
      this.scriptInstanceMeta?.id,
      this.scriptInstanceMeta?.entrypoint,
      this.scriptInstanceMeta?.startDate,
      options.timezoneId,
      options.deviceProfile,
      this.viewport,
      options.locale,
      optionsToStore,
    );
  }

  public recordCommandStart(commandMeta: ICommandMeta) {
    this.commands.push(commandMeta);
    this.db.commands.insert(commandMeta);
  }

  public recordCommandFinished(commandMeta: ICommandMeta) {
    this.db.commands.insert(commandMeta);
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
  ): IResourceMeta {
    const resourceId = resourceFailedEvent.id;
    if (!resourceId) {
      this.logger.warn('Session.FailedResourceWithoutId', {
        resourceFailedEvent,
        error,
      });
      return;
    }

    try {
      const convertedMeta = this.resourceEventToMeta(tabId, resourceFailedEvent);
      const resource = this.resourcesById.get(resourceId);

      if (!resource) {
        this.resourcesById.set(convertedMeta.id, convertedMeta);
        this.db.resources.insert(tabId, convertedMeta, null, resourceFailedEvent, error);
        return convertedMeta;
      }

      // if we already have this resource, we need to merge
      const existingDbRecord = this.db.resources.get(resourceId);

      existingDbRecord.type ??= convertedMeta.type;
      resource.type ??= convertedMeta.type;
      existingDbRecord.devtoolsRequestId ??= resourceFailedEvent.browserRequestId;
      existingDbRecord.browserBlockedReason = resourceFailedEvent.browserBlockedReason;
      existingDbRecord.browserCanceled = resourceFailedEvent.browserCanceled;
      existingDbRecord.redirectedToUrl ??= resourceFailedEvent.redirectedToUrl;
      existingDbRecord.statusCode ??= convertedMeta.response.statusCode;
      existingDbRecord.statusMessage ??= convertedMeta.response.statusMessage;
      existingDbRecord.browserLoadFailure = convertedMeta.response?.browserLoadFailure;

      if (!resource.response) {
        resource.response = convertedMeta.response ?? ({} as any);
      }

      if (convertedMeta.response.headers) {
        const responseHeaders = JSON.stringify(convertedMeta.response.headers);
        if (responseHeaders.length > existingDbRecord.responseHeaders?.length) {
          existingDbRecord.responseHeaders = responseHeaders;
          resource.response.headers = convertedMeta.response.headers;
        }
      }
      if (resourceFailedEvent.responseOriginalHeaders) {
        const responseHeaders = JSON.stringify(resourceFailedEvent.responseOriginalHeaders);
        if (responseHeaders.length > existingDbRecord.responseOriginalHeaders?.length) {
          existingDbRecord.responseOriginalHeaders = responseHeaders;
        }
      }
      if (error) {
        existingDbRecord.httpError = ResourcesTable.getErrorString(error);
      }

      resource.response.browserLoadFailure = convertedMeta.response?.browserLoadFailure;

      this.db.resources.save(existingDbRecord);
      return resource;
    } catch (saveError) {
      this.logger.warn('SessionState.captureResourceFailed::ErrorSaving', {
        error: saveError,
        resourceFailedEvent,
      });
    }
  }

  public captureResourceError(
    tabId: number,
    resourceEvent: IRequestSessionResponseEvent,
    error: Error,
  ): IResourceMeta {
    const resource = this.resourceEventToMeta(tabId, resourceEvent);
    this.db.resources.insert(tabId, resource, null, resourceEvent, error);

    if (!this.resourcesById.has(resource.id)) {
      this.resourcesById.set(resource.id, resource);
    }
    return resource;
  }

  public captureResourceRequestId(
    resourceId: number,
    browserRequestId: string,
    tabId: number,
  ): IResourceMeta {
    const resource = this.resourcesById.get(resourceId);
    if (resource) {
      resource.tabId = tabId;

      // NOTE: browserRequestId can be shared amongst redirects
      this.browserRequestIdToResources[browserRequestId] ??= [];
      this.browserRequestIdToResources[browserRequestId].push({
        resourceId,
        url: resource.url,
      });
      this.db.resources.updateResource(resourceId, { browserRequestId, tabId });
    }
    return resource;
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
      this.resourcesById.set(resource.id, resource);
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
    const { request, response, resourceType, browserRequestId, redirectedToUrl } =
      resourceEvent as IRequestSessionResponseEvent;

    if (browserRequestId) {
      // NOTE: browserRequestId can be shared amongst redirects
      this.browserRequestIdToResources[browserRequestId] ??= [];
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

  public getResourceLookupMap(tabId: number): { [method_url: string]: IResourceMeta[] } {
    const result: { [method_url: string]: IResourceMeta[] } = {};
    for (const resource of this.resourcesById.values()) {
      if (resource.tabId === tabId) {
        const key = `${resource.request.method}_${resource.request.url}`;
        result[key] ??= [];
        result[key].push(resource);
      }
    }
    return result;
  }

  public getResources(tabId: number): IResourceMeta[] {
    const resources: IResourceMeta[] = [];
    for (const resource of this.resourcesById.values()) {
      if (resource.tabId === tabId) resources.push(resource);
    }
    return resources;
  }

  public getResourceData(id: number, decompress: boolean): Promise<Buffer> {
    return this.db.resources.getResourceBodyById(id, decompress);
  }

  public getResourceMeta(id: number): IResourceMeta {
    return this.resourcesById.get(id);
  }

  ///////   FRAMES ///////

  public captureFrameDetails(frame: FrameEnvironment): void {
    this.db.frames.insert({
      id: frame.id,
      tabId: frame.tab.id,
      domNodeId: frame.domNodeId,
      parentId: frame.parentId,
      devtoolsFrameId: frame.devtoolsFrameId,
      name: frame.puppetFrame.name,
      securityOrigin: frame.securityOrigin,
      startCommandId: frame.createdAtCommandId,
      createdTimestamp: frame.createdTime.getTime(),
    });
  }

  public captureError(tabId: number, frameId: number, source: string, error: Error): void {
    this.db.pageLogs.insert(tabId, frameId, source, error.stack || String(error), new Date());
  }

  public captureLog(
    tabId: number,
    frameId: number,
    consoleType: string,
    message: string,
    location?: string,
  ): void {
    let level = 'info';
    if (message.startsWith('ERROR:') && message.includes(injectedSourceUrl)) {
      level = 'error';
    }
    this.logger[level]('Window.console', { message });
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

  public recordNavigation(navigation: INavigation) {
    this.db.frameNavigations.insert(navigation);
    if (
      navigation.stateChanges.has(LoadStatus.Load) ||
      navigation.stateChanges.has(LoadStatus.ContentPaint)
    ) {
      this.hasLoadedAnyPage = true;
    }
    for (const date of navigation.stateChanges.values()) {
      if (date > this.lastNavigationTime) this.lastNavigationTime = date;
    }
    if (navigation.initiatedTime) this.lastNavigationTime = navigation.initiatedTime;
  }

  public checkForResponsive(): {
    hasRecentErrors: boolean;
    lastActivityDate: Date;
    lastCommandName: string;
    closeDate: Date | null;
  } {
    let lastSuccessDate = this.createDate;

    if (!this.lastNavigationTime) {
      const lastNavigation = this.db.frameNavigations.last();
      if (lastNavigation && lastNavigation.initiatedTime) {
        this.lastNavigationTime = new Date(
          lastNavigation.loadTime ??
            lastNavigation.contentPaintedTime ??
            lastNavigation.initiatedTime,
        );
        this.hasLoadedAnyPage = !!lastNavigation.initiatedTime || !!lastNavigation.loadTime;
      }
    }

    if (this.lastNavigationTime && this.lastNavigationTime > lastSuccessDate) {
      lastSuccessDate = this.lastNavigationTime;
    }

    for (let i = this.commands.length - 1; i >= 0; i -= 1) {
      const command = this.commands[i];
      if (!command.endDate) continue;
      const endDate = new Date(command.endDate);
      if (
        this.hasLoadedAnyPage &&
        endDate > lastSuccessDate &&
        !command.resultType?.includes('Error')
      ) {
        lastSuccessDate = endDate;
        break;
      }
    }

    const hasRecentErrors = this.lastErrorTime >= lastSuccessDate;

    const lastCommand = this.lastCommand;
    let lastActivityDate = lastSuccessDate ? new Date(lastSuccessDate) : null;
    let lastCommandName: string;
    if (lastCommand) {
      lastCommandName = lastCommand.name;
      const commandDate = new Date(lastCommand.endDate ?? lastCommand.runStartDate);
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

  public captureDomEvents(
    tabId: number,
    frameId: number,
    domChanges: IDomChangeEvent[],
    mouseEvents: IMouseEvent[],
    focusEvents: IFocusEvent[],
    scrollEvents: IScrollEvent[],
  ) {
    let lastCommand = this.lastCommand;
    if (!lastCommand) return; // nothing to store yet
    for (const domChange of domChanges) {
      lastCommand = this.getCommandForTimestamp(lastCommand, domChange[2]);
      this.db.domChanges.insert(tabId, frameId, lastCommand.id, domChange);
    }

    for (const mouseEvent of mouseEvents) {
      lastCommand = this.getCommandForTimestamp(lastCommand, mouseEvent[8]);
      this.db.mouseEvents.insert(tabId, frameId, lastCommand.id, mouseEvent);
    }

    for (const focusEvent of focusEvents) {
      lastCommand = this.getCommandForTimestamp(lastCommand, focusEvent[3]);
      this.db.focusEvents.insert(tabId, frameId, lastCommand.id, focusEvent);
    }

    for (const scrollEvent of scrollEvents) {
      lastCommand = this.getCommandForTimestamp(lastCommand, scrollEvent[2]);
      this.db.scrollEvents.insert(tabId, frameId, lastCommand.id, scrollEvent);
    }
  }

  public getCommandForTimestamp(lastCommand: ICommandMeta, timestamp: number): ICommandMeta {
    let command = lastCommand;
    if (command.runStartDate <= timestamp && command.endDate > timestamp) {
      return command;
    }

    for (let i = this.commands.length - 1; i >= 0; i -= 1) {
      command = this.commands[i];
      if (command.runStartDate <= timestamp) break;
    }
    return command;
  }

  public captureDevtoolsMessage(event: IPuppetContextEvents['devtools-message']): void {
    this.db.devtoolsMessages.insert(event);
  }

  public captureTab(
    tabId: number,
    pageId: string,
    devtoolsSessionId: string,
    parentTabId?: number,
    detachedAtCommandId?: number,
  ): void {
    this.db.tabs.insert(
      tabId,
      pageId,
      devtoolsSessionId,
      this.viewport,
      parentTabId,
      detachedAtCommandId,
    );
  }

  public captureSocketEvent(socketEvent: ISocketEvent): void {
    this.db.sockets.insert(socketEvent.socket);
  }

  /////// JsPath Calls
  public findDetachedJsPathCalls(callsite: string, key?: string): IJsPathHistory[] {
    const sessionsDb = SessionsDb.find();
    const detachedCalls = sessionsDb.detachedJsPathCalls.find(
      this.scriptInstanceMeta,
      callsite,
      key,
    );
    if (detachedCalls?.execJsPathHistory) {
      return JSON.parse(detachedCalls.execJsPathHistory);
    }
    return null;
  }

  public recordDetachedJsPathCalls(calls: IJsPathHistory[], callsite: string, key?: string): void {
    if (!calls?.length) return;
    const sessionsDb = SessionsDb.find();
    sessionsDb.detachedJsPathCalls.insert(
      this.scriptInstanceMeta,
      callsite,
      calls,
      new Date(),
      key,
    );
  }
}
