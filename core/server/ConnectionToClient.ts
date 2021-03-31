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
import PuppetLaunchError from '@secret-agent/puppet/lib/PuppetLaunchError';
import { DependenciesMissingError } from '@secret-agent/puppet/lib/DependenciesMissingError';
import IUserProfile from '@secret-agent/core-interfaces/IUserProfile';
import SessionClosedOrMissingError from '@secret-agent/commons/SessionClosedOrMissingError';
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
  private hasActiveCommand = false;

  private clientExposedMethods = new Map<string, keyof this & string>([
    ['Core.connect', 'connect'],
    ['Core.disconnect', 'disconnect'],
    ['Core.logUnhandledError', 'logUnhandledError'],
    ['Session.create', 'createSession'],
    ['Session.close', 'closeSession'],
    ['Session.configure', 'configure'],
    ['Session.getAgentMeta', 'getAgentMeta'],
    ['Session.exportUserProfile', 'exportUserProfile'],
    ['Session.getTabs', 'getTabs'],
    ['Session.waitForNewTab', 'waitForNewTab'],
    ['Session.addEventListener', 'addEventListener'],
    ['Session.removeEventListener', 'removeEventListener'],
  ]);

  ///////  CORE SERVER CONNECTION  /////////////////////////////////////////////////////////////////////////////////////

  public async handleRequest(payload: ICoreRequestPayload): Promise<void> {
    const { messageId, command, meta } = payload;

    const session = meta?.sessionId ? Session.get(meta.sessionId) : undefined;

    // json converts args to null which breaks undefined argument handlers
    const args = payload.args.map(x => (x === null ? undefined : x));

    let data: any;
    try {
      this.hasActiveCommand = true;
      data = await this.executeCommand(command, args, meta);
    } catch (error) {
      // if we're closing, don't emit errors
      const shouldSkipLogging =
        (this.isClosing || session?.isClosing) && error instanceof CanceledPromiseError;
      const isChildProcess = !!process.send;
      const isLaunchError = this.isLaunchError(error);

      if ((isChildProcess === false && shouldSkipLogging === false) || isLaunchError) {
        log.error('ConnectionToClient.HandleRequestError', {
          error,
          sessionId: session?.id ?? meta?.sessionId,
        });
      }
      data = this.serializeError(error);
      data.isDisconnecting = this.isClosing || session?.isClosing;
    } finally {
      this.hasActiveCommand = false;
    }

    const commandId = session?.sessionState?.lastCommand?.id;

    const response: ICoreResponsePayload = {
      responseId: messageId,
      commandId,
      data,
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
    for (const id of this.sessionIds) {
      const promise = Session.get(id)?.close();
      if (promise) closeAll.push(promise.catch(err => err));
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
      osPlatform: session.browserEmulator.osPlatform,
    };
  }

  public exportUserProfile(meta: ISessionMeta): Promise<IUserProfile> {
    const session = Session.get(meta.sessionId);
    return UserProfile.export(session);
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

  /////// INTERNAL FUNCTIONS /////////////////////////////////////////////////////////////////////////////

  private async executeCommand(command: string, args: any[], meta: ISessionMeta): Promise<any> {
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
      sessionsDataLocation: session.baseDir,
      tabId: tab.id,
    };
  }

  private isLaunchError(error: Error): boolean {
    return error instanceof PuppetLaunchError || error instanceof DependenciesMissingError;
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
