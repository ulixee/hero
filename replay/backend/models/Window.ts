import { app, BrowserWindow, Rectangle } from 'electron';
import { resolve } from 'path';
import Application from '../Application';
import ReplayApi from '~backend/api';
import storage from '../storage';
import AppView from './AppView';
import ReplayView from './ReplayView';
import IWindowLocation, { InternalLocations } from '~shared/interfaces/IWindowLocation';
import ViewBackend from '~backend/models/ViewBackend';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import IReplayMeta from '~shared/interfaces/IReplayMeta';
import generateContextMenu from '~backend/menus/generateContextMenu';
import { ISessionTab } from '~shared/interfaces/ISaSession';

export default class Window {
  public static list: Window[] = [];
  public static current: Window;
  public activeView: ViewBackend;
  public browserWindow: BrowserWindow;

  public get replayApi() {
    if (this.isReplayActive) return this.replayView.replayApi;
  }

  public get isReplayActive() {
    return this.activeView instanceof ReplayView;
  }

  public readonly replayView: ReplayView;
  public readonly appView: AppView;

  private readonly windowState: any = {};

  private readonly navHistory: { location?: IWindowLocation; replayMeta?: IReplayMeta }[] = [];

  private navCursor = -1;

  private _fullscreen = false;
  private isReady: Promise<void>;

  protected constructor(state: { replayApi?: ReplayApi; location?: IWindowLocation }) {
    this.browserWindow = new BrowserWindow({
      minWidth: 400,
      minHeight: 450,
      width: 900,
      height: 700,
      transparent: false,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        javascript: true,
        enableRemoteModule: true,
      },
      icon: resolve(app.getAppPath(), 'logo.png'),
      show: false,
    });

    this.loadSavedState();
    this.browserWindow.show();

    this.bindListenersToWindow();

    this.replayView = new ReplayView(this);
    this.appView = new AppView(this);

    this.isReady = this.load(state);
  }

  public get id() {
    return this.browserWindow.id;
  }

  public get webContents() {
    return this.browserWindow.webContents;
  }

  public get fullscreen() {
    return this._fullscreen;
  }

  public set fullscreen(val: boolean) {
    this._fullscreen = val;
    this.fixBounds();
  }

  public sendToRenderer(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  public goBack() {
    if (this.hasBack()) {
      return this.goToHistory(this.navCursor - 1);
    }
  }

  public goForward() {
    if (this.hasNext()) {
      return this.goToHistory(this.navCursor + 1);
    }
  }

  public hasBack() {
    return this.navCursor > 0;
  }

  public hasNext() {
    return this.navCursor + 1 < this.navHistory.length;
  }

  public async openAppLocation(location: IWindowLocation, navigateToHistoryIdx?: number) {
    console.log('Navigating to %s', location);

    this.replayView.detach();

    this.logHistory({ location }, navigateToHistoryIdx);

    this.activeView = this.appView;
    await this.appView.load(location);

    this.sendToRenderer('location:updated', {
      location,
      hasNext: this.hasNext(),
      hasBack: this.hasBack(),
    });
  }

  public async openReplayApi(replayApi: ReplayApi, navigateToHistoryIdx?: number) {
    console.log('Navigating to Replay Api (%s)', replayApi.apiHost);

    this.appView.detach();

    this.logHistory({ replayMeta: replayApi.saSession }, navigateToHistoryIdx);

    this.activeView = this.replayView;
    await this.replayView.load(replayApi);
    await this.fixBounds();

    this.sendToRenderer('location:updated', {
      saSession: replayApi.saSession,
      hasNext: this.hasNext(),
      hasBack: this.hasBack(),
    });
  }

  public addRelatedSession(related: { id: string; name: string }) {
    if (
      !this.replayApi ||
      this.replayApi.saSession.relatedSessions.some(x => x.id === related.id)
    ) {
      return;
    }

    this.replayApi.saSession.relatedSessions.push(related);
    this.sendToRenderer('location:updated', {
      saSession: this.replayApi.saSession,
      hasNext: this.hasNext(),
      hasBack: this.hasBack(),
    });
  }

  public onNewReplayTab(tab: ISessionTab) {
    this.sendToRenderer('replay:new-tab', tab);
  }

  public setAddressBarUrl(url: string) {
    this.sendToRenderer('replay:page-url', url);
  }

  public setActiveTabId(id: number) {
    this.sendToRenderer('replay:active-tab', id);
  }

  public async loadReplayTab(id: number) {
    await this.replayView.loadTab(id);
    await this.fixBounds();
  }

  public replayOnFocus() {
    this.replayView.start();
  }

  public async fixBounds() {
    const newBounds = await this.getAvailableBounds();
    if (this.isReplayActive) {
      this.replayView.fixBounds(newBounds);
    } else {
      this.appView.fixBounds(newBounds);
    }
  }

  public async getAvailableBounds(): Promise<Rectangle> {
    const { width, height } = this.browserWindow.getContentBounds();
    const toolbarContentHeight = await this.getHeaderHeight();

    const bounds = {
      x: 0,
      y: this.fullscreen ? 0 : toolbarContentHeight + 1,
      width,
      height: this.fullscreen ? height : height - toolbarContentHeight,
    };
    if (this.isReplayActive) {
      bounds.height -= TOOLBAR_HEIGHT;
    }
    return bounds;
  }

  public hideMessageOverlay(messageId: string) {
    if (messageId === ReplayView.MESSAGE_HANG_ID) {
      this.replayView.replayApi.showUnresponsiveMessage = false;
    }
  }

  protected async load(state: { replayApi?: ReplayApi; location?: IWindowLocation }) {
    const { replayApi, location } = state || {};
    await this.browserWindow.loadURL(Application.instance.getPageUrl('header'));

    // resize the BrowserView's height when the toolbar height changes
    await this.webContents.executeJavaScript(`
        const {ipcRenderer} = require('electron');
        const resizeObserver = new ResizeObserver(() => {
          ipcRenderer.send('resize-height');
        });
        const elem = document.querySelector('.HeaderPage');
        resizeObserver.observe(elem);
      `);

    if (replayApi) {
      return this.openReplayApi(replayApi);
    }
    return this.openAppLocation(location ?? InternalLocations.Dashboard);
  }

  /////// HISTORY  /////////////////////////////////////////////////////////////////////////////////////////////////////

  private async goToHistory(index: number) {
    const history = this.navHistory[index];
    if (history.location) return this.openAppLocation(history.location, index);

    const api = await ReplayApi.connect(history.replayMeta);
    return this.openReplayApi(api, index);
  }

  private logHistory(
    history: { replayMeta?: IReplayMeta; location?: IWindowLocation },
    historyIdx?: number,
  ) {
    if (historyIdx !== undefined) {
      this.navCursor = historyIdx;
    } else {
      this.navHistory.length = this.navCursor + 1;
      this.navCursor = this.navHistory.length;
      this.navHistory.push(history);
    }
  }

  private async getHeaderHeight() {
    return await this.webContents.executeJavaScript(
      `document.querySelector('.HeaderPage').offsetHeight`,
    );
  }

  private bindListenersToWindow() {
    this.browserWindow.on('enter-full-screen', () => {
      this.sendToRenderer('fullscreen', true);
      this.fixBounds();
    });

    this.browserWindow.on('leave-full-screen', () => {
      this.sendToRenderer('fullscreen', false);
      this.fixBounds();
    });

    this.browserWindow.on('enter-html-full-screen', () => {
      this.fullscreen = true;
      this.sendToRenderer('html-fullscreen', true);
    });

    this.browserWindow.on('leave-html-full-screen', () => {
      this.fullscreen = false;
      this.sendToRenderer('html-fullscreen', false);
    });

    this.browserWindow.on('scroll-touch-begin', () => {
      this.sendToRenderer('scroll-touch-begin');
    });

    this.browserWindow.on('scroll-touch-end', () => {
      this.activeView.webContents.send('scroll-touch-end');
      this.sendToRenderer('scroll-touch-end');
    });

    this.browserWindow.on('focus', () => {
      Window.current = this;
    });

    // Update window bounds on resize and on move when window is not maximized.
    this.browserWindow.on('resize', () => {
      if (!this.browserWindow.isMaximized()) {
        this.windowState.bounds = this.browserWindow.getBounds();
      }
    });

    this.browserWindow.on('move', () => {
      if (!this.browserWindow.isMaximized()) {
        this.windowState.bounds = this.browserWindow.getBounds();
      }
    });

    this.browserWindow.on('maximize', () => this.resize());
    this.browserWindow.on('restore', () => this.resize());
    this.browserWindow.on('unmaximize', () => this.resize());
    this.browserWindow.on('close', () => this.close());

    this.webContents.on('context-menu', (e, params) => {
      generateContextMenu(params, this.webContents).popup();
    });

    this.webContents.on('ipc-message', (e, message) => {
      if (message === 'resize-height') {
        this.fixBounds();
      }
    });
  }

  private loadSavedState() {
    try {
      const windowState = storage.windowState;
      Object.assign(this.windowState, windowState);

      if (Window.list.length > 0) {
        const last = Window.list[Window.list.length - 1];
        this.windowState.bounds = last.browserWindow.getBounds();
        this.windowState.bounds.x += 10;
        this.windowState.bounds.y += 10;
      }

      this.browserWindow.setBounds({ ...this.windowState.bounds });
      if (this.windowState.isMaximized) this.browserWindow.maximize();
      if (this.windowState.isFullscreen) this.browserWindow.setFullScreen(true);
    } catch (e) {
      storage.windowState = {};
      storage.persistAll();
    }
  }

  private resize() {
    setImmediate(() => this.fixBounds());
  }

  private close() {
    this.windowState.isMaximized = this.browserWindow.isMaximized();
    this.windowState.isFullscreen = this.browserWindow.isFullScreen();
    storage.windowState = this.windowState;
    storage.persistAll();
    this.browserWindow.setBrowserView(null);
    this.replayView.destroy();
    this.replayView.destroy();
    this.appView.destroy();

    Window.list = Window.list.filter(x => x.browserWindow.id !== this.browserWindow.id);
    if (this.webContents.isDevToolsOpened) {
      this.webContents.closeDevTools();
    }
  }

  public static create(
    initialLocation: { replayApi?: ReplayApi; location?: IWindowLocation } = {},
  ) {
    const window = new Window(initialLocation);
    this.list.push(window);
    return window;
  }

  public static noneOpen() {
    return this.list.filter(Boolean).length === 0;
  }
}
