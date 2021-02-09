import IConfigureSessionOptions from '@secret-agent/core-interfaces/IConfigureSessionOptions';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ICreateSessionOptions from '@secret-agent/core-interfaces/ICreateSessionOptions';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import ICoreRequestPayload from '@secret-agent/core-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@secret-agent/core-interfaces/ICoreResponsePayload';
import ICoreConfigureOptions from '@secret-agent/core-interfaces/ICoreConfigureOptions';
import ICoreEventPayload from '@secret-agent/core-interfaces/ICoreEventPayload';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import IAgentMeta from '@secret-agent/core-interfaces/IAgentMeta';
import Log from '@secret-agent/commons/Logger';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import Session from '../lib/Session';
import Tab from '../lib/Tab';
import GlobalPool from '../lib/GlobalPool';
import Core from '../index';
import UserProfile from '../lib/UserProfile';
import BrowserEmulators from '../lib/BrowserEmulators';

const { log } = Log(module);

export default class ConnectionToClient extends TypedEventEmitter<{
  close: { fatalError?: Error };
  message: ICoreResponsePayload | ICoreEventPayload;
}> {
  public isClosing = false;
  public isPersistent = true;
  public autoShutdownMillis = 500;

  private autoShutdownTimer: NodeJS.Timer;
  private readonly sessionIds = new Set<string>();

  ///////  CORE SERVER CONNECTION  /////////////////////////////////////////////////////////////////////////////////////

  public async handleRequest(payload: ICoreRequestPayload): Promise<void> {
    const { messageId, command, meta } = payload;

    // json converts args to null which breaks undefined argument handlers
    const args = payload.args.map(x => (x === null ? undefined : x));

    const session = meta?.sessionId ? Session.get(meta.sessionId) : undefined;

    let data: any;
    let isError = false;
    try {
      if (command in this) {
        if (meta) {
          data = await this[command](meta, ...args);
        } else {
          data = await this[command](...args);
        }
      } else {
        // if not on this function, assume we're sending on to tab
        const tab = Session.getTab(meta);
        if (typeof tab[command] === 'function') {
          data = await tab[command](...args);
        } else {
          isError = true;
          data = new Error(`Command not available on tab (${command} - ${typeof tab[command]})`);
        }
      }
    } catch (error) {
      // if we're closing, don't emit errors
      if ((this.isClosing || session?.isClosing) && error instanceof CanceledPromiseError) {
        return;
      }
      isError = true;
      data =
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              ...error,
            }
          : new Error(`Unknown error occurred ${error}`);
    }

    const commandId = session?.sessionState?.lastCommand?.id;

    const response: ICoreResponsePayload = {
      responseId: messageId,
      commandId,
      data,
      isError,
    };
    this.emit('message', response);
  }

  public async connect(
    options: ICoreConfigureOptions & { isPersistent?: boolean } = {},
  ): Promise<{ maxConcurrency: number; browserEmulatorIds: string[] }> {
    this.isPersistent = options.isPersistent ?? true;
    this.isClosing = false;
    await Core.start(options, false);
    return {
      maxConcurrency: GlobalPool.maxConcurrentAgentsCount,
      browserEmulatorIds: BrowserEmulators.emulatorIds,
    };
  }

  public logUnhandledError(error: Error, fatalError = false): void {
    if (fatalError) {
      log.error('Client.UnhandledError(fatal)', { clientError: error, sessionId: null });
    } else {
      log.error('Client.UnhandledErrorOrRejection', { clientError: error, sessionId: null });
    }
  }

  public async disconnect(fatalError?: Error): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    clearTimeout(this.autoShutdownTimer);
    const closeAll: Promise<any>[] = [];
    for (const id of this.sessionIds) {
      const promise = Session.get(id)?.close();
      if (promise) closeAll.push(promise);
    }
    await Promise.all(closeAll);
    this.isPersistent = false;
    this.emit('close', { fatalError });
  }

  public isActive() {
    return this.sessionIds.size > 0 || this.isPersistent;
  }

  ///////  SESSION /////////////////////////////////////////////////////////////////////////////////////////////////////

  public getTabs(meta: ISessionMeta): ISessionMeta[] {
    const session = Session.get(meta.sessionId);
    return session.tabs.filter(x => !x.isClosing).map(x => this.getSessionMeta(x));
  }

  public getAgentMeta(meta: ISessionMeta): IAgentMeta {
    const session = Session.get(meta.sessionId);
    return <IAgentMeta>{
      sessionId: session.id,
      sessionName: session.options.sessionName,
      browserEmulatorId: session.browserEmulatorId,
      humanEmulatorId: session.humanEmulatorId,
      viewport: session.viewport,
      locale: session.browserEmulator.locale,
      timezoneId: session.timezoneId,
      blockedResourceTypes: session.options.blockedResourceTypes,
      upstreamProxyUrl: session.upstreamProxyUrl,
      userAgentString: session.browserEmulator.userAgentString,
    };
  }

  public async exportUserProfile(meta: ISessionMeta) {
    const session = Session.get(meta.sessionId);
    return await UserProfile.export(session);
  }

  public async createSession(options: ICreateSessionOptions = {}): Promise<ISessionMeta> {
    if (this.isClosing) throw new Error('Connection closed');
    clearTimeout(this.autoShutdownTimer);
    const session = await GlobalPool.createSession(options);
    this.sessionIds.add(session.id);
    session.on('awaited-event', this.emit.bind(this, 'message'));
    session.on('closing', () => this.sessionIds.delete(session.id));
    session.on('closed', this.checkForAutoShutdown.bind(this));

    const tab = await session.createTab();
    return this.getSessionMeta(tab);
  }

  public async closeSession(sessionMeta: ISessionMeta): Promise<void> {
    await Session.get(sessionMeta.sessionId)?.close();
  }

  public configure(sessionMeta: ISessionMeta, options: IConfigureSessionOptions): Promise<void> {
    const session = Session.get(sessionMeta.sessionId);
    return session.configure(options);
  }

  public async waitForNewTab(
    sessionMeta: ISessionMeta,
    opts: IWaitForOptions,
  ): Promise<ISessionMeta> {
    const tab = Session.getTab(sessionMeta);
    const newTab = await tab.waitForNewTab(opts);
    return this.getSessionMeta(newTab);
  }

  public addEventListener(
    sessionMeta: ISessionMeta,
    jsPath: IJsPath,
    type: string,
  ): { listenerId: string } {
    const session = Session.get(sessionMeta.sessionId);
    return session.awaitedEventListener.listen(sessionMeta, jsPath, type);
  }

  public removeEventListener(sessionMeta: ISessionMeta, id: string): void {
    const session = Session.get(sessionMeta.sessionId);
    session.awaitedEventListener.remove(id);
  }

  private checkForAutoShutdown(): void {
    if (this.isActive()) return;
    clearTimeout(this.autoShutdownTimer);
    this.autoShutdownTimer = setTimeout(() => {
      if (this.isActive()) return;
      return this.disconnect();
    }, this.autoShutdownMillis).unref();
  }

  private getSessionMeta(tab: Tab): ISessionMeta {
    const session = tab.session;
    return {
      sessionId: session.id,
      sessionsDataLocation: session.baseDir,
      tabId: tab.id,
    };
  }
}
