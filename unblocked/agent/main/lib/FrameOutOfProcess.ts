import Frame from './Frame';
import Page from './Page';
import NetworkManager from './NetworkManager';
import DevtoolsSession from './DevtoolsSession';
import DomStorageTracker from './DomStorageTracker';
import BrowserContext from './BrowserContext';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';

export default class FrameOutOfProcess {
  public page: Page;
  public frame: Frame;
  public devtoolsSession: DevtoolsSession;

  private networkManager: NetworkManager;
  private domStorageTracker: DomStorageTracker;
  private get browserContext(): BrowserContext {
    return this.page.browserContext;
  }

  constructor(page: Page, frame: Frame) {
    this.devtoolsSession = frame.devtoolsSession;
    this.page = page;
    this.frame = frame;
    this.networkManager = new NetworkManager(
      this.devtoolsSession,
      frame.logger,
      page.browserContext.proxy,
    );
    this.domStorageTracker = new DomStorageTracker(
      page,
      page.browserContext.domStorage,
      this.networkManager,
      page.logger,
      page.domStorageTracker.isEnabled,
    );
  }

  public async initialize(): Promise<void> {
    this.page.bindSessionEvents(this.devtoolsSession);
    const results = await Promise.all([
      this.networkManager.initializeFromParent(this.page.networkManager).catch(err => err),
      this.page.framesManager.initialize(this.devtoolsSession).catch(err => err),
      this.domStorageTracker.initialize().catch(err => err),
      this.devtoolsSession
        .send('Target.setAutoAttach', {
          autoAttach: true,
          waitForDebuggerOnStart: true,
          flatten: true,
        })
        .catch(err => err),
      this.browserContext.initializeOutOfProcessIframe(this).catch(err => err),
      this.devtoolsSession.send('Runtime.runIfWaitingForDebugger').catch(err => err),
    ]);

    for (const error of results) {
      if (error && error instanceof Error) {
        if (error instanceof CanceledPromiseError) continue;
        throw error;
      }
    }
  }
}
