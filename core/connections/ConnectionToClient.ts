import IConfigureSessionOptions from '@ulixee/hero-interfaces/IConfigureSessionOptions';
import ISessionMeta from '@ulixee/hero-interfaces/ISessionMeta';
import { IJsPath } from 'awaited-dom/base/AwaitedPath';
import ISessionCreateOptions from '@ulixee/hero-interfaces/ISessionCreateOptions';
import {
  addTypedEventListeners,
  removeEventListeners,
  TypedEventEmitter,
} from '@ulixee/commons/lib/eventUtils';
import ICoreRequestPayload from '@ulixee/hero-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/hero-interfaces/ICoreResponsePayload';
import ICoreConfigureOptions from '@ulixee/hero-interfaces/ICoreConfigureOptions';
import ICoreEventPayload from '@ulixee/hero-interfaces/ICoreEventPayload';
import IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import IHeroMeta from '@ulixee/hero-interfaces/IHeroMeta';
import Log from '@ulixee/commons/lib/Logger';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import PuppetLaunchError from '@ulixee/hero-puppet/lib/PuppetLaunchError';
import IUserProfile from '@ulixee/hero-interfaces/IUserProfile';
import SessionClosedOrMissingError from '@ulixee/commons/lib/SessionClosedOrMissingError';
import TimeoutError from '@ulixee/commons/interfaces/TimeoutError';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import IRegisteredEventListener from '@ulixee/commons/interfaces/IRegisteredEventListener';
import Session from '../lib/Session';
import Tab from '../lib/Tab';
import GlobalPool from '../lib/GlobalPool';
import Core from '../index';
import SessionDb from '../dbs/SessionDb';

const { log } = Log(module);

export default class ConnectionToClient extends TypedEventEmitter<{
  close: { fatalError?: Error };
  message: ICoreResponsePayload | ICoreEventPayload;
}> {
  public isClosing = false;
  public isPersistent = true;
  public autoShutdownMillis = 500;

  private autoShutdownTimer: NodeJS.Timer;
  private readonly sessionIds = new Map<string, IRegisteredEventListener[]>();
  private hasActiveCommand = false;

  private clientExposedMethods = new Map<string, keyof this & string>([
    ['Core.connect', 'connect'],
    ['Core.disconnect', 'disconnect'],
    ['Core.logUnhandledError', 'logUnhandledError'],
    ['Session.create', 'createSession'],
    ['Session.close', 'closeSession'],
    ['Session.configure', 'configure'],
    ['Session.detachTab', 'detachTab'],
    ['Session.flush', 'flush'],
    ['Session.getHeroMeta', 'getHeroMeta'],
    ['Session.exportUserProfile', 'exportUserProfile'],
    ['Session.getTabs', 'getTabs'],
    ['Session.waitForNewTab', 'waitForNewTab'],
    ['Session.addEventListener', 'addEventListener'],
    ['Session.removeEventListener', 'removeEventListener'],
  ]);

  ///////  CORE SERVER CONNECTION  /////////////////////////////////////////////////////////////////////////////////////

  public async handleRequest(payload: ICoreRequestPayload): Promise<void> {
    const { commandId, startDate, sendDate, messageId, command, meta, recordCommands } = payload;
    const session = meta?.sessionId ? Session.get(meta.sessionId) : undefined;

    // json converts args to null which breaks undefined argument handlers
    const args = payload.args.map(x => (x === null ? undefined : x));

    let data: any;
    try {
      this.hasActiveCommand = true;
      if (recordCommands) await this.recordCommands(meta, sendDate, recordCommands);
      data = await this.executeCommand(command, args, meta, { commandId, startDate, sendDate });
    } catch (error) {
      const isClosing = session?.isClosing || this.isClosing;
      // if we're closing, don't emit errors
      let shouldSkipLogging = isClosing && error instanceof CanceledPromiseError;

      // don't log timeouts when explicitly provided timeout (NOTE: doesn't cover goto)
      if (args && error instanceof TimeoutError) {
        for (const arg of args) {
          if (arg && !Number.isNaN(arg.timeoutMs)) {
            shouldSkipLogging = true;
          }
        }
      }

      const isChildProcess = !!process.send;
      const isLaunchError = this.isLaunchError(error);

      if ((isChildProcess === false && shouldSkipLogging === false) || isLaunchError) {
        log.error('ConnectionToClient.HandleRequestError', {
          error,
          sessionId: meta?.sessionId,
        });
      }
      data = this.serializeError(error);
      data.isDisconnecting = isClosing;
    } finally {
      this.hasActiveCommand = false;
    }

    const response: ICoreResponsePayload = {
      responseId: messageId,
      data,
    };
    this.emit('message', response);
  }

  public async connect(
    options: ICoreConfigureOptions & { isPersistent?: boolean } = {},
  ): Promise<{ maxConcurrency: number }> {
    this.isPersistent = options.isPersistent ?? true;
    this.isClosing = false;
    await Core.start(options, false);
    return {
      maxConcurrency: GlobalPool.maxConcurrentClientCount,
    };
  }

  public logUnhandledError(error: Error, fatalError = false): void {
    if (fatalError) {
      log.error('ConnectionToClient.UnhandledError(fatal)', {
        clientError: error,
        sessionId: null,
      });
    } else {
      log.error('ConnectionToClient.UnhandledErrorOrRejection', {
        clientError: error,
        sessionId: null,
      });
    }
  }

  public async disconnect(fatalError?: Error): Promise<void> {
    if (this.isClosing) return;
    this.isClosing = true;
    const logId = log.stats('ConnectionToClient.Disconnecting', { sessionId: null, fatalError });
    clearTimeout(this.autoShutdownTimer);
    const closeAll: Promise<any>[] = [];
    for (const id of this.sessionIds.keys()) {
      closeAll.push(this.closeSession({ sessionId: id }).catch(err => err));
    }
    await Promise.all(closeAll);
    this.isPersistent = false;
    this.emit('close', { fatalError });
    log.stats('ConnectionToClient.Disconnected', { sessionId: null, parentLogId: logId });
  }

  public isActive(): boolean {
    return this.sessionIds.size > 0 || this.isPersistent || this.hasActiveCommand;
  }

  ///////  SESSION /////////////////////////////////////////////////////////////////////////////////////////////////////

  public flush(meta: ISessionMeta): void {
    log.info('SessionFlushing', { sessionId: meta.sessionId });
  }

  public getTabs(meta: ISessionMeta): ISessionMeta[] {
    const session = Session.get(meta.sessionId);
    return [...session.tabsById.values()]
      .filter(x => !x.isClosing)
      .map(x => this.getSessionMeta(x));
  }

  public async detachTab(
    meta: ISessionMeta,
    tabId: number,
    callsite: string,
  ): Promise<{ meta: ISessionMeta; prefetchedJsPaths: IJsPathResult[] }> {
    const session = Session.get(meta.sessionId);
    const tab = session.getTab(tabId);
    const { detachedTab, prefetchedJsPaths } = await session.detachTab(tab, callsite);
    return {
      meta: this.getSessionMeta(detachedTab),
      prefetchedJsPaths,
    };
  }

  public getHeroMeta(meta: ISessionMeta): IHeroMeta {
    const session = Session.get(meta.sessionId);
    const { plugins, viewport, locale, timezoneId, geolocation } = session;
    const { userAgentString, operatingSystemPlatform } = plugins.browserEmulator;
    return <IHeroMeta>{
      sessionId: session.id,
      sessionName: session.options.sessionName,
      browserEmulatorId: plugins.browserEmulator.id,
      humanEmulatorId: plugins.humanEmulator.id,
      blockedResourceTypes: session.options.blockedResourceTypes,
      upstreamProxyUrl: session.upstreamProxyUrl,
      viewport,
      locale,
      timezoneId,
      geolocation,
      userAgentString,
      operatingSystemPlatform,
    };
  }

  public exportUserProfile(meta: ISessionMeta): Promise<IUserProfile> {
    const session = Session.get(meta.sessionId);
    return session.exportUserProfile();
  }

  public async createSession(options: ISessionCreateOptions = {}): Promise<ISessionMeta> {
    if (this.isClosing) throw new Error('Connection closed');
    clearTimeout(this.autoShutdownTimer);
    let session: Session;
    let tab: Tab;
    if (options.sessionResume?.sessionId) {
      session = await this.resumeSession(options);
      tab = session?.getLastActiveTab();
    }

    if (!session) {
      session = await GlobalPool.createSession(options);
    }
    this.sessionIds.set(
      session.id,
      addTypedEventListeners(session, [
        ['awaited-event', this.emit.bind(this, 'message')],
        ['closing', () => this.sessionIds.delete(session.id)],
        ['closed', this.checkForAutoShutdown.bind(this)],
      ]),
    );

    tab ??= await session.createTab();
    return this.getSessionMeta(tab);
  }

  public async closeSession(sessionMeta: ISessionMeta): Promise<void> {
    const session = Session.get(sessionMeta.sessionId);
    if (!session) return;

    // if this session is set to keep alive and core is closing,
    if (session.options.sessionKeepAlive && !Core.isClosing) {
      session.emit('kept-alive');
      removeEventListeners(this.sessionIds.get(session.id) ?? []);
      return;
    }

    await session.close();
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

  /////// INTERNAL FUNCTIONS /////////////////////////////////////////////////////////////////////////////

  private async recordCommands(
    meta: ISessionMeta,
    sendDate: Date,
    recordCommands: ICoreRequestPayload['recordCommands'],
  ): Promise<void> {
    for (const { command, args, commandId, startDate } of recordCommands) {
      try {
        const cleanArgs = args.map(x => (x === null ? undefined : x));
        await this.executeCommand(command, cleanArgs, meta, {
          commandId,
          startDate,
          sendDate,
        });
      } catch (error) {
        log.warn('RecordingCommandsFailed', {
          sessionId: meta.sessionId,
          error,
          command,
        });
      }
    }
  }

  private async executeCommand(
    command: string,
    args: any[],
    meta: ISessionMeta,
    commandMeta: { commandId: number; startDate: Date; sendDate: Date },
  ): Promise<any> {
    const target = command.split('.').shift();
    if (target === 'Core' || target === 'Session') {
      if (!this.clientExposedMethods.has(command)) {
        return new Error(`Command not allowed (${command})`);
      }

      const method = this.clientExposedMethods.get(command) as string;
      if (target === 'Core' || command === 'Session.create') {
        return await this[method](...args);
      }

      const session = Session.get(meta.sessionId);
      session.sessionState.nextCommandMeta = commandMeta;
      if (!session) {
        return new SessionClosedOrMissingError(
          `The requested command (${command}) references a session that is closed or invalid.`,
        );
      }

      return await this[method](meta, ...args);
    }

    // if not on this function, assume we're sending on to tab
    const tab = Session.getTab(meta);
    if (!tab) {
      return new SessionClosedOrMissingError(
        `The requested command (${command}) references a tab that is no longer part of session or has been closed.`,
      );
    }
    tab.session.sessionState.nextCommandMeta = commandMeta;

    const method = command.split('.').pop();

    /////// Tab Functions
    if (target === 'Tab') {
      if (!tab.isAllowedCommand(method)) {
        return new Error(`Command not allowed (${command})`);
      }

      return await tab[method](...args);
    }

    /////// Frame Functions
    if (target === 'FrameEnvironment') {
      const frameEnvironment =
        tab.frameEnvironmentsById.get(meta.frameId) ?? tab.mainFrameEnvironment;

      if (!frameEnvironment || (meta.frameId && !tab.frameEnvironmentsById.has(meta.frameId))) {
        return new Error(
          `The requested frame environment for this command (${command}) is not longer available`,
        );
      }

      if (!frameEnvironment.isAllowedCommand(method)) {
        return new Error(`Command not allowed (${command})`);
      }

      return await frameEnvironment[method](...args);
    }
  }

  private async resumeSession(options: ISessionCreateOptions): Promise<Session> {
    const { sessionResume } = options;
    const session = Session.get(sessionResume.sessionId);
    if (session) {
      await session.resume(options);
      return session;
    }

    // if session not active, re-create
    let db: SessionDb;
    try {
      db = SessionDb.getCached(sessionResume.sessionId, true);
    } catch (err) {
      // not found
    }
    if (!db) {
      const data = [
        ''.padEnd(50, '-'),
        `------HERO SESSION ID`.padEnd(50, '-'),
        `------${Core.dataDir}`.padEnd(50, '-'),
        `------${sessionResume.sessionId ?? ''}`.padEnd(50, '-'),
        ''.padEnd(50, '-'),
      ].join('\n');

      throw new Error(
        `You're trying to resume a Hero session that could not be located.
${data}`,
      );
    }

    const sessionDb = db.session.get();
    Session.restoreOptionsFromSessionRecord(options, sessionDb);

    return GlobalPool.createSession(options);
  }

  private checkForAutoShutdown(): void {
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
      frameId: tab.mainFrameId,
      tabId: tab.id,
    };
  }

  private isLaunchError(error: Error): boolean {
    return error instanceof PuppetLaunchError || error.name === 'DependenciesMissingError';
  }

  private serializeError(error: Error): object {
    if (this.isLaunchError(error)) {
      return new Error(
        'CoreServer needs further setup to launch the browserEmulator. See server logs.',
      );
    }
    if (error instanceof Error) return error;

    return new Error(`Unknown error occurred ${error}`);
  }
}
