import { v1 as uuidv1 } from 'uuid';
import Window from './Window';
import ReplayApi from '~backend/api';
import ViewBackend from './ViewBackend';
import ReplayTabState from '~backend/api/ReplayTabState';
import PlaybarView from '~backend/models/PlaybarView';
import Application from '~backend/Application';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import IRectangle from '~shared/interfaces/IRectangle';
import { DomActionType, IFrontendDomChangeEvent } from '~shared/interfaces/IDomChangeEvent';
import { IFrontendMouseEvent, IScrollRecord } from '~shared/interfaces/ISaSession';

const domReplayerScript = require.resolve('../../injected-scripts/domReplayerSubscribe');

export default class ReplayView extends ViewBackend {
  public static MESSAGE_HANG_ID = 'script-hang';
  public replayApi: ReplayApi;
  public tabState: ReplayTabState;
  public readonly playbarView: PlaybarView;

  private isTabLoaded = false;
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

    this.playbarView = new PlaybarView(window);
    this.checkResponsive = this.checkResponsive.bind(this);

    let resizeTimeout;
    this.window.browserWindow.on('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.sizeWebContentsToFit(), 20);
    });
  }

  public async load(replayApi: ReplayApi) {
    const isFirstLoad = !this.replayApi;
    this.clearReplayApi();

    this.replayApi = replayApi;

    const session = this.webContents.session;
    const scriptUrl = await replayApi.getReplayScript();
    session.setPreloads([scriptUrl]);
    if (isFirstLoad) this.detach(false);
    this.replayApi.onTabChange = this.onTabChange.bind(this);
    await replayApi.isReady;
    await this.loadTab();
  }

  public start() {
    this.playbarView.play();
  }

  public async loadTab(id?: number) {
    this.isTabLoaded = false;
    await this.clearTabState();
    this.attach();

    this.window.setAddressBarUrl('Loading session...');

    this.tabState = id ? this.replayApi.getTab(id) : this.replayApi.startTab;
    this.tabState.on('tick:changes', this.checkResponsive);
    await this.playbarView.load(this.tabState);

    console.log('Loaded tab state', this.tabState.startOrigin);
    this.window.setActiveTabId(this.tabState.tabId);
    this.window.setAddressBarUrl(this.tabState.startOrigin);

    this.browserView.setBackgroundColor('#ffffff');

    await Promise.race([
      this.webContents.loadURL(this.tabState.startOrigin),
      new Promise(resolve => setTimeout(resolve, 500)),
    ]);

    this.isTabLoaded = true;
    this.sizeWebContentsToFit();

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
    this.playbarView.fixBounds({
      x: 0,
      y: newBounds.height + newBounds.y,
      width: newBounds.width,
      height: TOOLBAR_HEIGHT,
    });
    super.fixBounds(newBounds);
    this.sizeWebContentsToFit();
    this.window.browserWindow.addBrowserView(this.playbarView.browserView);
  }

  public attach() {
    if (this.isAttached) return;
    super.attach();
    this.playbarView.attach();
    this.interceptHttpRequests();
    this.webContents.openDevTools({ mode: 'detach', activate: false });
  }

  public detach(detachPlaybar = true) {
    this.webContents.closeDevTools();
    super.detach();
    // clear out everytime we detach
    this._browserView = null;
    if (detachPlaybar) this.playbarView.detach();
  }

  public async onTickDrag(tickValue: number) {
    if (!this.isAttached || !this.tabState) return;
    const events = this.tabState.setTickValue(tickValue);
    await this.publishTickChanges(events);
  }

  public async gotoNextTick() {
    const nextTick = await this.nextTick();
    this.playbarView.changeTickOffset(nextTick?.playbarOffset);
  }

  public async gotoPreviousTick() {
    const state = this.tabState.transitionToPreviousTick();
    await this.publishTickChanges(state);
    this.playbarView.changeTickOffset(this.tabState.currentPlaybarOffsetPct);
  }

  public async nextTick(startMillisDeficit = 0) {
    try {
      if (!this.tabState) return { playbarOffset: 0, millisToNextTick: 100 };
      const startTime = new Date();
      // calculate when client should request the next tick
      let millisToNextTick = 50;

      const events = this.tabState.transitionToNextTick();
      await this.publishTickChanges(events);
      setImmediate(() => this.checkResponsive());

      if (this.tabState.currentTick && this.tabState.nextTick) {
        const nextTickTime = new Date(this.tabState.nextTick.timestamp);
        const currentTickTime = new Date(this.tabState.currentTick.timestamp);
        const diff = nextTickTime.getTime() - currentTickTime.getTime();
        const fnDuration = new Date().getTime() - startTime.getTime();
        millisToNextTick = diff - fnDuration + startMillisDeficit;
      }

      return { playbarOffset: this.tabState.currentPlaybarOffsetPct, millisToNextTick };
    } catch (err) {
      console.log('ERROR getting next tick', err);
      return { playbarOffset: this.tabState.currentPlaybarOffsetPct, millisToNextTick: 100 };
    }
  }

  public destroy() {
    super.destroy();
    this.clearReplayApi();
    this.clearTabState();
  }

  public sizeWebContentsToFit() {
    if (!this.tabState || !this.isTabLoaded) return;
    const screenSize = this.browserView.getBounds();

    const viewSize = {
      height: Math.min(this.tabState.viewportHeight, screenSize.height),
      width: this.tabState.viewportWidth,
    };

    // NOTE: This isn't working in electron, so setting scale instead
    const viewPosition = {
      x: screenSize.width > viewSize.width ? (screenSize.width - viewSize.width) / 2 : 0,
      y: screenSize.height > viewSize.height ? (screenSize.height - viewSize.height) / 2 : 0,
    };

    const scale = screenSize.width / viewSize.width;

    if (viewSize.height * scale > viewSize.height) {
      viewSize.height *= scale;
    }

    this.browserView.webContents.enableDeviceEmulation({
      deviceScaleFactor: 1,
      screenPosition: 'desktop',
      viewSize,
      scale,
      viewPosition,
      screenSize,
    });
  }

  private async publishTickChanges(
    events: [IFrontendDomChangeEvent[], number[], IFrontendMouseEvent, IScrollRecord],
  ) {
    if (!events || !events.length) return;
    const [domChanges] = events;

    if (domChanges?.length) {
      const [{ action, frameIdPath }] = domChanges;
      const hasNewUrlToLoad = action === DomActionType.newDocument && frameIdPath === 'main';
      if (hasNewUrlToLoad) {
        const nav = domChanges.shift();
        await Promise.race([
          this.webContents.loadURL(nav.textContent),
          new Promise(resolve => setTimeout(resolve, 500)),
        ]);
      }
    }

    const columns = [
      'action',
      'nodeId',
      'nodeType',
      'textContent',
      'tagName',
      'namespaceUri',
      'parentNodeId',
      'previousSiblingId',
      'attributeNamespaces',
      'attributes',
      'properties',
      'frameIdPath',
    ];
    const compressedChanges = domChanges
      ? domChanges.map(x => columns.map(col => x[col]))
      : undefined;
    this.webContents.send('dom:apply', columns, compressedChanges, ...events.slice(1));
    this.window.setAddressBarUrl(this.tabState.urlOrigin);
  }

  private async onTabChange(tab: ReplayTabState) {
    await tab.isReady.promise;
    this.window.onReplayTabChange({
      tabId: tab.tabId,
      detachedFromTabId: tab.detachedFromTabId,
      startOrigin: tab.startOrigin,
      createdTime: tab.tabCreatedTime,
      width: tab.viewportWidth,
      height: tab.viewportHeight,
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
      this.webContents.session.setPreloads([]);
      this.replayApi.onTabChange = null;
      this.replayApi.close();
      this.replayApi = null;
    }
  }

  private clearTabState() {
    if (this.tabState) {
      this.tabState.off('tick:changes', this.checkResponsive);
      this.tabState = null;
      this.detach(false);
    }
  }

  private interceptHttpRequests() {
    const session = this.webContents.session;
    session.protocol.interceptStreamProtocol('http', async (request, callback) => {
      console.log('intercepting http stream', request.url);
      const result = await this.replayApi.getResource(request.url);
      callback(result);
    });
    session.protocol.interceptStreamProtocol('https', async (request, callback) => {
      console.log('intercepting https stream', request.url);
      const result = await this.replayApi.getResource(request.url);
      callback(result);
    });
  }
}
