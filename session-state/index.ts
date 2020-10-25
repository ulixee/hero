import fs from "fs";
import { IRequestSessionRequestEvent, IRequestSessionResponseEvent } from "@secret-agent/mitm/handlers/RequestSession";
import IWebsocketMessage from "@secret-agent/core-interfaces/IWebsocketMessage";
import IResourceMeta from "@secret-agent/core-interfaces/IResourceMeta";
import ICommandMeta from "@secret-agent/core-interfaces/ICommandMeta";
import Log, { IBoundLog, ILogEntry, LogEvents } from "@secret-agent/commons/Logger";
import { IDomChangeEvent } from "@secret-agent/injected-scripts/interfaces/IDomChangeEvent";
import { LocationStatus } from "@secret-agent/core-interfaces/Location";
import IViewport from "@secret-agent/core-interfaces/IViewport";
import INavigation from "@secret-agent/core-interfaces/INavigation";
import { IMouseEvent } from "@secret-agent/injected-scripts/interfaces/IMouseEvent";
import { IFocusEvent } from "@secret-agent/injected-scripts/interfaces/IFocusEvent";
import { IScrollEvent } from "@secret-agent/injected-scripts/interfaces/IScrollEvent";
import IScriptInstanceMeta from "@secret-agent/core-interfaces/IScriptInstanceMeta";
import IWebsocketResourceMessage from "@secret-agent/core/interfaces/IWebsocketResourceMessage";
import type { IPuppetContextEvents } from "@secret-agent/puppet/interfaces/IPuppetContext";
import ResourceState from "@secret-agent/mitm/interfaces/ResourceState";
import TabNavigations from "./lib/TabNavigations";
import { IFrameRecord } from "./models/FramesTable";
import SessionsDb from "./lib/SessionsDb";
import SessionDb from "./lib/SessionDb";

const { log } = Log(module);

export default class SessionState {
  public static registry = new Map<string, SessionState>();
  public readonly commands: ICommandMeta[] = [];
  public get lastCommand() {
    if (this.commands.length === 0) return;
    return this.commands[this.commands.length - 1];
  }

  public readonly sessionId: string;

  public viewport: IViewport;
  public readonly navigationsByTabId: { [tabId: string]: TabNavigations } = {};
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

  private readonly browserRequestIdToResources: { [browserRequestId: string]: { resourceId: number; url:string }[] } = {};
  private lastErrorTime?: Date;
  private closeDate?: Date;

  private websocketMessageIdCounter = 0;

  private readonly logSubscriptionId: number;

  constructor(
    sessionsDirectory: string,
    sessionId: string,
    sessionName: string | null,
    scriptInstanceMeta: IScriptInstanceMeta,
    emulatorId: string,
    humanoidId: string,
    hasEmulatorPolyfills: boolean,
  ) {
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.scriptInstanceMeta = scriptInstanceMeta;
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
      emulatorId,
      humanoidId,
      hasEmulatorPolyfills,
      this.createDate,
      scriptInstanceMeta?.id,
      scriptInstanceMeta?.entrypoint,
      scriptInstanceMeta?.startDate,
    );

    this.logSubscriptionId = LogEvents.subscribe(this.onLogEvent.bind(this));
  }

  public registerTab(tabId: string) {
    this.navigationsByTabId[tabId] = new TabNavigations(this.db);
  }

  public async runCommand<T>(commandFn: () => Promise<T>, commandMeta: ICommandMeta) {
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

  public onWebsocketMessages(resourceId: number, listenerFn: (message: IWebsocketMessage) => any) {
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
  ) {
    const listeners = this.websocketListeners[resourceId];
    if (!listeners) return;
    const idx = listeners.indexOf(listenerFn);
    if (idx >= 0) listeners.splice(idx, 1);
  }

  public captureWebsocketMessage(event: {
    browserRequestId: string;
    isFromServer: boolean;
    message: string | Buffer;
  }) {
    const { browserRequestId, isFromServer, message } = event;
    const resources = this.browserRequestIdToResources[browserRequestId];
    if (!resources?.length) {
      this.logger.error(`CaptureWebsocketMessageError.UnregisteredResource`, {
        browserRequestId,
        message,
      });
      return;
    }

    const finalRedirect = resources[resources.length-1];

    const resourceMessage = {
      resourceId: finalRedirect.resourceId,
      message,
      messageId: this.websocketMessageIdCounter += 1,
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

  public captureResourceState(id: number, state: Map<ResourceState, Date>) {
    this.db.resourceStates.insert(id, state)
  }

  public captureResourceError(tabId: string, resourceEvent: IRequestSessionResponseEvent, error: Error) {
    const resource = this.resourceEventToMeta(tabId, resourceEvent);
    this.db.resources.insert(tabId, resource, null, resourceEvent, error);
  }

  public captureResource(
    tabId: string,
    resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent,
    isResponse: boolean,
  ): IResourceMeta {
    const resource = this.resourceEventToMeta(tabId, resourceEvent);
    const resourceResponseEvent = resourceEvent as IRequestSessionResponseEvent;

    this.db.resources.insert(tabId, resource, resourceResponseEvent.body, resourceEvent);

    if (isResponse) {
      const navigations = this.navigationsByTabId[tabId];
      if (resource.url === navigations?.currentUrl && resourceEvent.request.method !== 'OPTIONS') {
        navigations.resourceLoadedForLocation(resource.id);
      }
      this.resources.push(resource);
    }
    return resource;
  }


  public resourceEventToMeta(tabId: string, resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent) {
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
        url: request.url
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

    if (response?.statusCode) {
      resource.response = response;
      if (response.url) resource.url = response.url;
      else resource.response.url = request.url;
    }

    return resource;
  }

  public getResources(tabId: string) {
    return this.resources.filter(x => x.tabId === tabId);
  }

  public async getResourceData(id: number) {
    return this.db.getResourceData(id);
  }

  public getResourceMeta(id: number) {
    return this.resources.find(x => x.id === id);
  }

  ///////   FRAMES ///////

  public captureFrameCreated(tabId: string, createdFrame: Pick<IFrameRecord, 'id' | 'parentId' | 'name' | 'securityOrigin'>, domNodeId: number ) {
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

  public captureSubFrameNavigated(tabId: string, frame: Pick<IFrameRecord, 'id' | 'parentId' | 'name' | 'securityOrigin'> & { navigationReason?: string}, navigatedInDocument: boolean) {
    const existing = this.frames[frame.id];
    if (existing) {
      existing.name = frame.name;
      existing.securityOrigin = frame.securityOrigin;
      this.db.frames.insert(existing);
    }
    // TODO: capture frame navigations
  }

  public captureError(tabId: string, frameId: string, source: string, error: Error) {
    this.logger.error('Window.error', { source, error });
    this.db.pageLogs.insert(tabId, frameId, source, error.stack || String(error), new Date());
  }

  public captureLog(
    tabId: string,
    frameId: string,
    consoleType: string,
    message: string,
    location?: string,
  ) {
    if (message.includes('Error: ') || message.startsWith('ERROR')) {
      this.logger.error('Window.error', { message });
    } else {
      this.logger.info('Window.console', { message });
    }
    this.db.pageLogs.insert(tabId, frameId, consoleType, message, new Date(), location);
  }

  public onLogEvent(entry: ILogEntry) {
    if (entry.sessionId === this.sessionId || !entry.sessionId) {
      if (entry.action === 'Window.runCommand') entry.data = { id: entry.data.id };
      if (entry.action === 'Window.ranCommand') entry.data = null;
      if (entry.level === 'error') {
        this.lastErrorTime = entry.timestamp;
      }
      this.db.sessionLogs.insert(entry);
    }
  }

  public close() {
    this.logger.info('SessionState.Closing');
    this.closeDate = new Date();
    this.db.session.update(this.sessionId, {
      closeDate: this.closeDate,
      viewport: this.viewport,
    });
    LogEvents.unsubscribe(this.logSubscriptionId);
    this.db.flush();
    this.db.close();
    SessionState.registry.delete(this.sessionId);
  }

  public checkForResponsive() {
    let lastSuccessDate = this.createDate;
    for (const navigation of Object.values(this.navigationsByTabId)) {
      const allContentLoaded = navigation.top?.stateChanges?.get('AllContentLoaded');
      const lastPageTime = allContentLoaded ?? navigation.top?.initiatedTime;
      if (lastPageTime && lastPageTime > lastSuccessDate) {
        lastSuccessDate = lastPageTime;
      }
      for (const command of this.commands) {
        if (!command.endDate) continue;
        const endDate = new Date(command.endDate);
        if (
          allContentLoaded &&
          endDate > lastSuccessDate &&
          !command.resultType?.includes('Error')
        ) {
          lastSuccessDate = endDate;
        }
      }
    }

    const hasRecentErrors = this.lastErrorTime >= lastSuccessDate;

    const lastCommand = this.lastCommand;
    let lastActivityDate = lastSuccessDate;
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

  public async getMainFrameDomChanges(
    frameLifecycles: INavigation[],
    sinceCommandId?: number,
  ) {
    return this.db.getDomChanges(
      frameLifecycles.map(x => x.frameId),
      sinceCommandId,
    );
  }

  public onPageEvents(
    tabId: string,
    frameId: string,
    domChanges: IDomChangeEvent[],
    mouseEvents: IMouseEvent[],
    focusEvents: IFocusEvent[],
    scrollEvents: IScrollEvent[],
  ) {
    this.logger.stats('State.onPageEvents', {
      tabId,
      frameId,
      dom: domChanges.length,
      mouse: mouseEvents.length,
      focusEvents: focusEvents.length,
      scrollEvents: scrollEvents.length,
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

  public captureDevtoolsMessage(event: IPuppetContextEvents['devtools-message']) {
    this.db.devtoolsMessages.insert(event);
  }

  public captureTab(tabId: string, pageId: string, devtoolsSessionId: string, openerTabId?: string, ) {
    this.db.tabs.insert(tabId, pageId, devtoolsSessionId, openerTabId);
  }

}
