import fs from 'fs';
import { EventEmitter } from 'events';
import {
  IRequestSessionRequestEvent,
  IRequestSessionResponseEvent,
} from '@secret-agent/mitm/handlers/RequestSession';
import IWebsocketMessage from '@secret-agent/core-interfaces/IWebsocketMessage';
import IResourceMeta from '@secret-agent/core-interfaces/IResourceMeta';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import Log, { ILogEntry, LogEvents } from '@secret-agent/commons/Logger';
import { IDomChangeEvent } from '@secret-agent/injected-scripts/interfaces/IDomChangeEvent';
import { LocationStatus } from '@secret-agent/core-interfaces/Location';
import IViewport from '@secret-agent/core-interfaces/IViewport';
import IPage from '@secret-agent/core-interfaces/IPage';
import { IMouseEvent } from '@secret-agent/injected-scripts/interfaces/IMouseEvent';
import { IFocusEvent } from '@secret-agent/injected-scripts/interfaces/IFocusEvent';
import { IScrollEvent } from '@secret-agent/injected-scripts/interfaces/IScrollEvent';
import IScriptInstanceMeta from '@secret-agent/core-interfaces/IScriptInstanceMeta';
import PageHistory from './lib/PageHistory';
import { IFrameRecord } from './models/FramesTable';
import IWebsocketResourceMessage from './interfaces/IWebsocketResourceMessage';
import SessionsDb from './lib/SessionsDb';
import SessionDb from './lib/SessionDb';

const { log } = Log(module);

export default class SessionState {
  public static registry = new Map<string, SessionState>();
  public emitter: EventEmitter;
  public readonly commands: ICommandMeta[] = [];
  public get lastCommand() {
    if (this.commands.length === 0) return;
    return this.commands[this.commands.length - 1];
  }

  public readonly sessionId: string;

  public viewport: IViewport;
  public readonly pages: PageHistory;
  public readonly db: SessionDb;

  private readonly sessionName: string;
  private readonly scriptInstanceMeta: IScriptInstanceMeta;
  private readonly createDate: Date;
  private readonly frames: { [frameId: number]: IFrameRecord } = {};
  private readonly resources: IResourceMeta[] = [];
  private readonly websocketMessages: IWebsocketResourceMessage[] = [];
  private readonly browserRequestIdToResourceId: { [browserRequestId: string]: number } = {};
  private lastErrorTime?: Date;
  private closeDate?: Date;
  private websocketMessageIdCounter = 0;

  private readonly logSubscriptionId: number;

  private websocketListeners: {
    [resourceId: string]: ((msg: IWebsocketResourceMessage) => any)[];
  } = {};

  constructor(
    sessionsDirectory: string,
    sessionId: string,
    sessionName: string | null,
    scriptInstanceMeta: IScriptInstanceMeta,
    emulatorId: string,
    humanoidId: string,
    hasEmulatorPolyfills: boolean,
  ) {
    this.createDate = new Date();
    this.sessionId = sessionId;
    this.sessionName = sessionName;
    this.scriptInstanceMeta = scriptInstanceMeta;
    SessionState.registry.set(sessionId, this);

    fs.mkdirSync(sessionsDirectory, { recursive: true });

    this.db = new SessionDb(sessionsDirectory, sessionId);
    this.pages = new PageHistory(this.db);
    this.emitter = new EventEmitter();

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

    this.emitter.on('websocket-message', (msg: IWebsocketResourceMessage) => {
      const listeners = this.websocketListeners[msg.resourceId];
      if (!listeners) return;
      for (const listener of listeners) {
        listener(msg);
      }
    });

    this.logSubscriptionId = LogEvents.subscribe(this.onLogEvent.bind(this));
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

  public captureWebsocketMessage(
    browserRequestId: string,
    isFromServer: boolean,
    message: string | Buffer,
  ) {
    const resourceId = this.browserRequestIdToResourceId[browserRequestId];
    if (!resourceId) {
      log.error(`CaptureWebsocketMessageError.UnregisteredResource`, {
        sessionId: this.sessionId,
        browserRequestId,
        message,
      });
      return;
    }

    const resourceMessage = {
      resourceId,
      message,
      messageId: this.websocketMessageIdCounter += 1,
      source: isFromServer ? 'server' : 'client',
    } as IWebsocketResourceMessage;

    this.websocketMessages.push(resourceMessage);
    this.db.websocketMessages.insert(this.lastCommand?.id, resourceMessage);

    this.emitter.emit('websocket-message', resourceMessage);
  }

  public captureResource(
    resourceEvent: IRequestSessionResponseEvent | IRequestSessionRequestEvent,
    isResponse: boolean,
  ): IResourceMeta {
    const { request } = resourceEvent;
    const {
      response,
      resourceType,
      body,
      browserRequestId,
      redirectedToUrl,
    } = resourceEvent as IRequestSessionResponseEvent;

    if (browserRequestId) {
      this.browserRequestIdToResourceId[browserRequestId] = resourceEvent.id;
    }

    const meta = {
      id: resourceEvent.id,
      url: request.url,
      receivedAtCommandId: this.lastCommand?.id,
      type: resourceType,
      isRedirect: !!redirectedToUrl,
      request: {
        ...request,
        postData: request.postData?.toString(),
      },
    } as IResourceMeta;

    if (isResponse && response?.statusCode) {
      meta.response = response;
      if (response.url) meta.url = response.url;
      else meta.response.url = request.url;
    }

    this.db.resources.insert(meta, body, resourceEvent);

    if (isResponse) {
      this.resources.push(meta);
      this.emitter.emit('resource', meta);
    }
    return meta;
  }

  public async forEachResource(onResourceFn: (resourceMeta: IResourceMeta) => Promise<any>) {
    for (const resource of this.resources) {
      await onResourceFn(resource);
    }
  }

  public async getResourceData(id: number) {
    return this.db.getResourceData(id);
  }

  public getResourceMeta(id: number) {
    return this.resources.find(x => x.id === id);
  }

  /////// / FRAMES ///////

  public captureFrameCreated(frameId: string, parentFrameId: string | null) {
    const frame = {
      id: frameId,
      parentId: parentFrameId,
      startCommandId: this.lastCommand?.id,
      url: null,
      createdTime: new Date().toISOString(),
    } as IFrameRecord;
    this.frames[frameId] = frame;
    this.db.frames.insert(frame);
  }

  public captureError(frameId: string, source: string, error: Error) {
    log.error('Window.error', { sessionId: this.sessionId, source, error });
    this.db.pageLogs.insert(frameId, source, error.stack || String(error), new Date());
  }

  public captureLog(frameId: string, consoleType: string, message: string, location?: string) {
    if (message.includes('Error: ') || message.startsWith('ERROR')) {
      log.error('Window.error', { sessionId: this.sessionId, message });
    } else {
      log.info('Window.console', { sessionId: this.sessionId, message });
    }
    this.db.pageLogs.insert(frameId, consoleType, message, new Date(), location);
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

  public async saveState() {
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
    const latestPage = this.pages.top;
    const allContentLoaded = this.pages.top?.stateChanges?.get('AllContentLoaded');
    let lastSuccessDate = allContentLoaded ?? latestPage?.initiatedTime ?? this.createDate;
    for (const command of this.commands) {
      if (!command.endDate) continue;
      if (
        allContentLoaded &&
        command.endDate > lastSuccessDate &&
        !command.resultType?.includes('Error')
      ) {
        lastSuccessDate = command.endDate;
      }
    }

    const hasRecentErrors = this.lastErrorTime >= lastSuccessDate;

    const lastCommand = this.lastCommand;
    let unresponsiveSeconds = 0;
    if (lastCommand) {
      const lastCommandDate = new Date(lastCommand.endDate ?? lastCommand.startDate).getTime();
      unresponsiveSeconds = Math.floor((new Date().getTime() - lastCommandDate) / 1000);
    }
    return {
      hasRecentErrors,
      unresponsiveSeconds,
      closeTime: this.closeDate,
    };
  }

  public async getPageDomChanges(pages: IPage[], sinceCommandId?: number) {
    return this.db.getDomChanges(
      pages.map(x => x.frameId),
      sinceCommandId,
    );
  }

  public onPageEvents(
    frameId: string,
    domChanges: IDomChangeEvent[],
    mouseEvents: IMouseEvent[],
    focusEvents: IFocusEvent[],
    scrollEvents: IScrollEvent[],
  ) {
    log.stats('State.onPageEvents', {
      sessionId: this.sessionId,
      dom: domChanges.length,
      mouse: mouseEvents.length,
      focusEvents: focusEvents.length,
      scrollEvents: scrollEvents.length,
    });
    const maxCommandId = domChanges.reduce((max, change) => {
      if (max > change[0]) return max;
      return change[0];
    }, -1);

    let startCommandId = maxCommandId;
    // find last page load
    for (let i = this.pages.history.length - 1; i >= 0; i -= 1) {
      const page = this.pages.history[i];
      if (page.stateChanges.has(LocationStatus.HttpResponded)) {
        startCommandId = page.startCommandId;
        break;
      }
    }

    for (const domChange of domChanges) {
      if (domChange[0] === -1) domChange[0] = startCommandId;
      this.db.domChanges.insert(frameId, domChange);
    }

    for (const mouseEvent of mouseEvents) {
      if (mouseEvent[0] === -1) mouseEvent[0] = startCommandId;
      this.db.mouseEvents.insert(mouseEvent);
    }

    for (const focusEvent of focusEvents) {
      if (focusEvent[0] === -1) focusEvent[0] = startCommandId;
      this.db.focusEvents.insert(focusEvent);
    }

    for (const scrollEvent of scrollEvents) {
      if (scrollEvent[0] === -1) scrollEvent[0] = startCommandId;
      this.db.scrollEvents.insert(scrollEvent);
    }
  }
}
