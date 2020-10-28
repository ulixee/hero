import { v1 as uuidv1 } from 'uuid';
import Window from './Window';
import ReplayApi from '~backend/api';
import ViewBackend from './ViewBackend';
import ReplayTabState from '~backend/api/ReplayTabState';
import PlaybarView from '~backend/models/PlaybarView';
import Application from '~backend/Application';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import IRectangle from '~shared/interfaces/IRectangle';
import { IFrontendDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';
import { IMouseEvent, IScrollRecord } from '~shared/interfaces/ISaSession';

const domReplayerScript = require.resolve('../../injected-scripts/domReplayerSubscribe');

export default class ReplayView extends ViewBackend {
  public static MESSAGE_HANG_ID = 'script-hang';
  public replayApi: ReplayApi;
  public tabState: ReplayTabState;
  public readonly playbarView: PlaybarView;

  private lastInactivityMillis = 0;

  public constructor(window: Window) {
    super(window, {
      preload: domReplayerScript,
      nodeIntegrationInSubFrames: true,
      enableRemoteModule: false,
      partition: uuidv1(),
      contextIsolation: true,
      webSecurity: false,
      javascript: false,
    });

    this.interceptHttpRequests();
    this.playbarView = new PlaybarView(window);
    this.checkResponsive = this.checkResponsive.bind(this);
  }

  public async load(replayApi: ReplayApi) {
    if (this.browserView.isDestroyed()) return;
    this.clearReplayApi();
    await this.window.webContents.session.clearCache();

    this.attach();

    this.replayApi = replayApi;
    this.replayApi.onNewTab = this.onNewTab.bind(this);
    await replayApi.isReady;
    await this.loadTab();
  }

  public start() {
    this.playbarView.play();
  }

  public async loadTab(id?: string) {
    this.clearTabState();
    this.window.setAddressBarUrl('Loading session...');

    this.tabState = id ? this.replayApi.getTab(id) : this.replayApi.getStartTab;
    this.tabState.on('tick:changes', this.checkResponsive);
    await this.playbarView.load(this.tabState);

    console.log('Loaded tab state', this.tabState.startOrigin);
    this.window.setActiveTabId(this.tabState.tabId);
    this.window.setAddressBarUrl(this.tabState.startOrigin);

    await this.webContents.loadURL(this.tabState.startOrigin);

    if (this.tabState.currentPlaybarOffsetPct > 0) {
      console.log('Resetting playbar offset to %s%', this.tabState.currentPlaybarOffsetPct);
      const events = this.tabState.setTickValue(this.tabState.currentPlaybarOffsetPct, true);
      await this.publishTickChanges(events);
    }
  }

  public onTickHover(rect: IRectangle, tickValue: number) {
    this.playbarView.onTickHover(rect, tickValue);
  }

  public fixBounds(newBounds: { x: number; width: number; y: any; height: number }) {
    super.fixBounds(newBounds);

    this.playbarView.fixBounds({
      x: 0,
      y: newBounds.height + newBounds.y,
      width: newBounds.width,
      height: TOOLBAR_HEIGHT,
    });
  }

  public attach() {
    super.attach();
    this.webContents.openDevTools({ mode: 'detach', activate: false });
  }

  public detach() {
    if (this.isAttached) {
      this.webContents.closeDevTools();
    }
    super.detach();
    this.playbarView.detach();
  }

  public async onTick(tickValue: number) {
    if (!this.isAttached || !this.tabState) return;
    const events = this.tabState.setTickValue(tickValue);
    await this.publishTickChanges(events);
  }

  public async gotoNextTick() {
    const offset = await this.nextTick();
    this.playbarView.changeTickOffset(offset);
  }

  public async gotoPreviousTick() {
    const state = this.tabState.gotoPreviousTick();
    await this.publishTickChanges(state);
    this.playbarView.changeTickOffset(this.tabState.currentPlaybarOffsetPct);
  }

  public async nextTick() {
    if (!this.isAttached || !this.tabState) return 0;
    const events = this.tabState.gotoNextTick();
    await this.publishTickChanges(events);
    setImmediate(() => this.checkResponsive());

    return this.tabState.currentPlaybarOffsetPct;
  }

  public destroy() {
    super.destroy();
    this.clearReplayApi();
    this.clearTabState();
  }

  private async publishTickChanges(
    events: [IFrontendDomChangeEvent[], number[], IMouseEvent, IScrollRecord],
  ) {
    if (!events || !events.length) return;
    const [domChanges] = events;
    if (domChanges?.length && domChanges[0].action === 'newDocument' && domChanges[0].isMainFrame) {
      const url = new URL(domChanges[0].textContent);
      const currentUrl = new URL(this.webContents.getURL());
      if (url.origin !== currentUrl.origin) {
        console.log('Re-navigating', url.href);
        domChanges.shift();
        await this.webContents.loadURL(url.href);
      }
    }
    this.webContents.send('dom:apply', ...events);
    this.window.setAddressBarUrl(this.tabState.urlOrigin);
  }

  private async onNewTab(tab: ReplayTabState) {
    await tab.isReady.promise;
    this.window.onNewReplayTab({
      tabId: tab.tabId,
      startOrigin: tab.startOrigin,
      createdTime: tab.tabCreatedTime,
    });
  }

  private checkResponsive() {
    const lastActivityMillis =
      new Date().getTime() - (this.replayApi.lastActivityDate ?? new Date()).getTime();

    if (lastActivityMillis < this.lastInactivityMillis) {
      this.lastInactivityMillis = lastActivityMillis;
      return;
    }
    if (lastActivityMillis - this.lastInactivityMillis < 500) return;
    this.lastInactivityMillis = lastActivityMillis;

    if (
      !this.tabState.replayTime.close &&
      lastActivityMillis >= 5e3 &&
      this.replayApi.lastCommandName !== 'waitForMillis' &&
      this.replayApi.showUnresponsiveMessage
    ) {
      const lastActivitySecs = Math.floor(lastActivityMillis / 1e3);
      Application.instance.overlayManager.show(
        'message-overlay',
        this.window.browserWindow,
        this.window.browserWindow.getContentBounds(),
        {
          title: 'Did your script hang?',
          message: `The last update was ${lastActivitySecs} seconds ago.`,
          id: ReplayView.MESSAGE_HANG_ID,
        },
      );
    } else {
      Application.instance.overlayManager.getByName('message-overlay').hide();
    }
  }

  private clearReplayApi() {
    if (this.replayApi) {
      this.replayApi.onNewTab = null;
      this.replayApi.close();
      this.replayApi = null;
    }
  }

  private clearTabState() {
    if (this.tabState) {
      this.tabState.off('tick:changes', this.checkResponsive);
      this.tabState = null;
    }
  }

  private interceptHttpRequests() {
    const session = this.webContents.session;
    session.protocol.interceptStreamProtocol('http', async (request, callback) => {
      console.log('intercepting http buffer', request.url);
      const result = await this.replayApi.getResource(request.url);
      callback(result);
    });
    session.protocol.interceptStreamProtocol('https', async (request, callback) => {
      console.log('intercepting https buffer', request.url);
      const result = await this.replayApi.getResource(request.url);
      callback(result);
    });
  }
}
