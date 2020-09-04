import { URL } from 'url';
import Protocol from 'devtools-protocol';
import { TypedEventEmitter } from '@secret-agent/commons/eventUtils';
import { CDPSession } from '../process/CDPSession';
import { assert } from './assert';
import { Credentials, NetworkManager } from './NetworkManager';
import { Keyboard } from './Keyboard';
import Mouse from './Mouse';
import Touchscreen from './Touchscreen';
import Frames, { IFrameEvents } from './Frames';
import { ICookie } from '../interfaces/ICookie';
import {
  debugError,
  exceptionDetailsToError,
  printStackTrace,
  valueFromRemoteObject,
} from './Utils';
import { BrowserContext } from './BrowserContext';
import { Worker } from './Worker';
import CookieParam = Protocol.Network.CookieParam;
import ConsoleAPICalledEvent = Protocol.Runtime.ConsoleAPICalledEvent;
import ExceptionThrownEvent = Protocol.Runtime.ExceptionThrownEvent;

export class Page extends TypedEventEmitter<IPageEvents> {
  public keyboard: Keyboard;
  public mouse: Mouse;
  public touchscreen: Touchscreen;
  public cdpSession: CDPSession;
  public targetId: string;
  public readonly browserContext: BrowserContext;
  public readonly opener: Page | null;

  public isClosed = false;
  public networkManager: NetworkManager;
  public frames: Frames;
  public readonly isReady: Promise<void>;

  public get mainFrameId() {
    return this.frames.mainFrameId;
  }

  public get url() {
    return this.frames.main.url;
  }

  private javascriptEnabled = true;

  private workersById = new Map<string, Worker>();

  constructor(
    cdpSession: CDPSession,
    targetId: string,
    browserContext: BrowserContext,
    opener: Page | null,
  ) {
    super();
    this.cdpSession = cdpSession;
    this.targetId = targetId;
    this.browserContext = browserContext;
    this.keyboard = new Keyboard(cdpSession);
    this.mouse = new Mouse(cdpSession, this.keyboard);
    this.touchscreen = new Touchscreen(cdpSession, this.keyboard);
    this.networkManager = new NetworkManager(cdpSession);
    this.frames = new Frames(cdpSession);
    this.opener = opener;

    this.cdpSession.on('Runtime.exceptionThrown', this.onRuntimeException.bind(this));
    this.cdpSession.on('Inspector.targetCrashed', this.onTargetCrashed.bind(this));
    this.cdpSession.on('Runtime.consoleAPICalled', this.onRuntimeConsole.bind(this));
    this.cdpSession.on('Target.attachedToTarget', this.onAttachedToTarget.bind(this));

    this.frames.on('frameCreated', this.emit.bind(this, 'frameCreated'));
    this.frames.on('frameNavigated', this.emit.bind(this, 'frameNavigated'));
    this.frames.on('frameLifecycle', ({ frame, name }) => {
      if (frame.id === this.mainFrameId && name === 'load') {
        this.emit('load');
      }
      this.emit('frameLifecycle', { frame, name });
    });

    this.cdpSession.once('disconnected', this.emit.bind(this, 'close'));

    this.isReady = this.initialize();
  }

  public onChildPage(page: Page) {
    this.emit('popup', { page });
  }

  async authenticate(credentials: Credentials): Promise<void> {
    return this.networkManager.setCredentials(credentials);
  }

  public async getPageCookies(): Promise<ICookie[]> {
    const { cookies } = await this.cdpSession.send('Network.getCookies', {
      urls: [this.url],
    });
    return cookies.map(
      x =>
        ({
          ...x,
          expires: String(x.expires),
        } as ICookie),
    );
  }

  public async getAllCookies() {
    const cookieResponse = await this.cdpSession.send('Network.getAllCookies');
    return cookieResponse.cookies.map(
      x =>
        ({
          ...x,
          expires: String(x.expires),
        } as ICookie),
    );
  }

  public async getIndexedDbsForOrigin(securityOrigin: string) {
    const { databaseNames } = await this.cdpSession.send('IndexedDB.requestDatabaseNames', {
      securityOrigin,
    });
    return databaseNames;
  }

  public async setCookies(cookies: ICookie[], origins: string[]) {
    const originUrls = (origins ?? []).map(x => new URL(x));
    const parsedCookies: CookieParam[] = [];
    for (const cookie of cookies) {
      const cookieToSend: CookieParam = {
        ...cookie,
        expires: cookie.expires ? parseInt(cookie.expires, 10) : null,
      };
      cookieToSend.url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
      const match = originUrls.find(x => {
        return x.hostname.endsWith(cookie.domain);
      });
      if (match) cookieToSend.url = match.href;

      parsedCookies.push(cookieToSend);
    }
    return await this.cdpSession.send('Network.setCookies', {
      cookies: parsedCookies,
    });
  }

  // some dialogs can't be handled in-page
  public handleJavascriptDialog(accept: boolean, promptText?: string) {
    return this.cdpSession.send('Page.handleJavaScriptDialog', { accept, promptText });
  }

  async setJavaScriptEnabled(enabled: boolean): Promise<void> {
    if (this.javascriptEnabled === enabled) return;
    this.javascriptEnabled = enabled;
    await this.cdpSession.send('Emulation.setScriptExecutionDisabled', {
      value: !enabled,
    });
  }

  async evaluate(expression: string) {
    return this.frames.runInFrame(expression, this.mainFrameId, false);
  }

  async selectAll() {
    // NOTE: might need more advanced handling https://github.com/GoogleChrome/puppeteer/issues/1313#issuecomment-480052880
    await this.evaluate(`document.execCommand('selectall', false, null)`);
  }

  /////// NAVIGATION ///////

  async navigate(url: string, options: { frameId?: string; referrer?: string } = {}) {
    const frameId = options.frameId ?? this.mainFrameId;
    const navigationResponse = await this.cdpSession.send('Page.navigate', {
      url,
      referrer: options.referrer,
      frameId,
    });
    if (navigationResponse.errorText) throw new Error(navigationResponse.errorText);

    return this.frames.waitForFrame(navigationResponse, true);
  }

  async goBack(): Promise<void> {
    return this.navigateToHistory(-1);
  }

  async goForward(): Promise<void> {
    return this.navigateToHistory(+1);
  }

  async bringToFront(): Promise<void> {
    await this.cdpSession.send('Page.bringToFront');
  }

  async close(): Promise<void> {
    await this.frames.close();
    assert(
      this.cdpSession.isConnected(),
      'Protocol error: Connection closed. Most likely the page has been closed.',
    );
    await this.cdpSession.send('Page.close');
  }

  didClose() {
    this.cdpSession.removeAllListeners();
  }

  private async navigateToHistory(delta: number): Promise<void> {
    const history = await this.cdpSession.send('Page.getNavigationHistory');
    const entry = history.entries[history.currentIndex + delta];
    if (!entry) return null;
    await this.cdpSession.send('Page.navigateToHistoryEntry', { entryId: entry.id });
  }

  private async initialize(): Promise<void> {
    await Promise.all([
      this.networkManager.initialize(),
      this.frames.initialize(),
      this.cdpSession.send('Target.setAutoAttach', {
        autoAttach: true,
        waitForDebuggerOnStart: true,
        flatten: true,
      }),
      this.cdpSession.send('Runtime.runIfWaitingForDebugger'),
    ]);

    // after initialized, send self to emitters
    this.browserContext.emit('page', this);
    if (this.opener) {
      await this.opener.isReady;
      this.opener.emit('popup', { page: this });
    }
  }

  private onAttachedToTarget(event: Protocol.Target.AttachedToTargetEvent) {
    const { sessionId, targetInfo, waitingForDebugger } = event;
    const { url, type } = targetInfo;
    const cdpSession = this.cdpSession.connection.getSession(sessionId);

    // TODO: see if frames forced into same site still have issues here
    // if (event.targetInfo.type === 'iframe') {
    //   // Frame id equals target id.
    //   const targetId = event.targetInfo.targetId;
    //   const frame = this._page._frameManager.frame(targetId)!;
    //   this._page._frameManager.removeChildFramesRecursively(frame);
    //   const frameSession = new FrameSession(this._crPage, cdpSession, targetId, this);
    //   this._crPage._sessions.set(targetId, frameSession);
    //   frameSession._initialize(false).catch(e => e);
    //   return;
    // }
    //

    if (type === 'service_worker') {
      const worker = new Worker(this.browserContext, cdpSession, url, type);
      cdpSession.on('Runtime.exceptionThrown', this.onRuntimeException.bind(this));
      worker.on('consoleLog', this.emit.bind(this, 'consoleLog'));
      this.workersById.set(sessionId, worker);
      worker.initialize(this.networkManager).catch(debugError);
      return;
    }

    if (waitingForDebugger) {
      return cdpSession
        .send('Runtime.runIfWaitingForDebugger')
        .catch(debugError)
        .then(() =>
          // detach from page session
          this.cdpSession.send('Target.detachFromTarget', { sessionId: event.sessionId }),
        )
        .catch(debugError);
    }
  }

  private onRuntimeException(msg: ExceptionThrownEvent) {
    const error = exceptionDetailsToError(msg.exceptionDetails);
    const frameId = this.frames.getFrameIdForExecutionContext(
      msg.exceptionDetails.executionContextId,
    );
    this.emit('pageError', {
      frameId,
      error,
    });
  }

  private async onRuntimeConsole(event: ConsoleAPICalledEvent) {
    const { executionContextId, args, stackTrace, type, context } = event;
    const frameId = this.frames.getFrameIdForExecutionContext(executionContextId);

    const message = args
      .map(arg => {
        this.cdpSession.disposeObject(arg);

        return valueFromRemoteObject(arg);
      })
      .join(' ');

    const location = `//#${context ?? 'nocontext'}${printStackTrace(stackTrace)}`;

    this.emit('consoleLog', {
      frameId,
      type,
      message,
      location,
    });
  }

  private onTargetCrashed() {
    this.emit('targetCrashed', { error: new Error('Target Crashed') });
  }
}

export interface IPageEvents extends IFrameEvents {
  close: undefined;
  load: undefined;
  targetCrashed: { error: Error };
  consoleLog: { frameId: string; type: string; message: string; location: string };
  pageError: { frameId: string; error: Error };
  popup: { page: Page };
}
