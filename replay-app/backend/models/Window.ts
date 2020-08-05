import { app, BrowserWindow } from 'electron';
import { resolve } from 'path';
import Application from '../Application';
import ReplayApi from '~backend/ReplayApi';
import storage from '../storage';
import InternalServer from '~shared/constants/files';
import ICreateTabOptions from '~shared/interfaces/ICreateTabOptions';
import { defaultTabOptions } from '~shared/constants/tabs';
import ITabMeta from '~shared/interfaces/ITabMeta';
import AppView from './AppView';
import ReplayView from './ReplayView';
import ITabLocation from '~shared/interfaces/ITabLocation';

export default class Window {
  public static list: Window[] = [];
  public static current: Window;

  public tabsById = new Map<number, AppView | ReplayView>();
  public _selectedTabId = 0;
  public _fullscreen = false;
  public browserWindow: BrowserWindow;
  public pendingReplayApi: ReplayApi;

  private readonly windowState: any = {};

  protected constructor(pendingReplayApi: ReplayApi) {
    this.pendingReplayApi = pendingReplayApi;
    this.browserWindow = new BrowserWindow({
      frame: false,
      minWidth: 400,
      minHeight: 450,
      width: 900,
      height: 700,
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#ffffff',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        javascript: true,
        enableRemoteModule: true,
      },
      icon: resolve(app.getAppPath(), 'static/logo.png'),
      show: false,
    });

    this.loadSavedState();
    this.browserWindow.show();

    this.bindListenersToWindow();

    this.browserWindow.loadURL(`${InternalServer.url}/app`);
    if (process.env.NODE_ENV === 'development') {
      this.webContents.openDevTools({ mode: 'detach' });
    }
  }

  public get fullscreen() {
    return this._fullscreen;
  }

  public set fullscreen(val: boolean) {
    this._fullscreen = val;
    this.fixBounds();
  }

  public get id() {
    return this.browserWindow.id;
  }

  public get webContents() {
    return this.browserWindow.webContents;
  }

  public get selectedTab() {
    return this.tabsById.get(this.selectedTabId);
  }

  public get selectedTabId() {
    return this._selectedTabId;
  }

  public set selectedTabId(value: number) {
    if (this._selectedTabId === value) return;

    const tab = this.tabsById.get(value);
    if (!tab) return;

    if (this.selectedTab) {
      this.browserWindow.removeBrowserView(this.selectedTab.browserView);
    }
    this._selectedTabId = value;

    this.browserWindow.addBrowserView(tab.browserView);
    this.webContents.focus();
    this.updateTitle();

    this.fixBounds();
  }

  public get selectedReplayTab() {
    const selected = this.selectedTab;
    if (selected instanceof ReplayView) return selected as ReplayView;
    return null;
  }

  public fixDragging() {
    const bounds = this.browserWindow.getBounds();
    this.browserWindow.setBounds({
      height: bounds.height + 1,
    });
    this.browserWindow.setBounds(bounds);
  }

  public sendToRenderer(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  public updateTitle() {
    const { title } = this.selectedTab;
    this.browserWindow.setTitle(title.trim() === '' ? app.name : `${title} - ${app.name}`);
  }

  public openAppLocation(location: ITabLocation) {
    console.log(
      'Navigating to %s. Will destroy current tab?',
      location,
      this.selectedTab instanceof ReplayView,
    );
    const selected = this.selectedTab;
    let replaceTabId: number;
    if (selected) {
      if (selected instanceof AppView) {
        return selected.loadLocation(location);
      }
      selected.webContents.closeDevTools();
      replaceTabId = selected.id;
    }

    this.trackTab(new AppView(this, location, replaceTabId));
  }

  public openReplayApi(replayApi: ReplayApi) {
    console.log(
      'Navigating to Replay Api (%s). Will destroy current tab?',
      replayApi.apiHost,
      this.selectedTab instanceof AppView,
    );
    const selected = this.selectedTab;
    let replaceTabId: number;
    if (selected) {
      if (selected instanceof ReplayView) {
        return selected.load(replayApi);
      }
      replaceTabId = selected.id;
    }

    this.trackTab(new ReplayView(this, replayApi, replaceTabId));
  }

  public createReplayTab(replayApi: ReplayApi) {
    console.log('Creating Replay Tab (%s)', replayApi.apiHost);
    const tab = this.trackTab(new ReplayView(this, replayApi));
    const id = tab.id;
    this.sendToRenderer('insert-tab', { id, active: true, saSession: replayApi.saSession }, true);
  }

  public createAppTab(opts: ICreateTabOptions, isNext = false, notifyRenderer = true) {
    if (this.pendingReplayApi) {
      const replayApi = this.pendingReplayApi;
      delete this.pendingReplayApi;
      return this.createReplayTab(replayApi);
    }

    const { location, active, index } = opts ?? defaultTabOptions;
    console.log('Creating App Tab (%s)', location);
    const tab = this.trackTab(new AppView(this, location));
    const id = tab.id;

    const tabMeta: ITabMeta = { id, location, active, index };
    if (notifyRenderer) {
      this.sendToRenderer('insert-tab', { ...tabMeta }, isNext);
    }
    return tabMeta;
  }

  public async fixBounds() {
    const tab = this.selectedTab;
    if (!tab) return;

    const { width, height } = this.browserWindow.getContentBounds();
    const toolbarContentHeight = await this.webContents.executeJavaScript(
      `document.body.offsetHeight`,
    );

    const newBounds = {
      x: 0,
      y: this.fullscreen ? 0 : toolbarContentHeight,
      width,
      height: this.fullscreen ? height : height - toolbarContentHeight,
    };

    tab.fixBounds(newBounds);
  }

  public destroyTab(id: number) {
    const tab = this.tabsById.get(id);

    this.tabsById.delete(id);

    if (tab && !tab.browserView.isDestroyed()) {
      this.browserWindow.removeBrowserView(tab.browserView);
      tab.destroy();
    }
  }

  private trackTab(tab: AppView | ReplayView) {
    const id = tab.id;
    this.tabsById.set(id, tab);
    tab.webContents.once('destroyed', () => {
      this.tabsById.delete(id);
    });
    return tab;
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
      this.selectedTab.webContents.send('scroll-touch-end');
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

    // resize the BrowserView's height when the toolbar height changes
    this.webContents.executeJavaScript(`
        const {ipcRenderer} = require('electron');
        const resizeObserver = new ResizeObserver(() => {
          ipcRenderer.send('resize-height');
        });
        resizeObserver.observe(document.body);
      `);

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

      this.browserWindow.setBounds({ ...this.windowState.bounds });
      if (this.windowState.isMaximized) this.browserWindow.maximize();
      if (this.windowState.isFullscreen) this.browserWindow.setFullScreen(true);
    } catch (e) {
      storage.windowState = {};
      storage.persistAll();
    }
  }

  private resize() {
    setTimeout(() => this.fixBounds(), 0);

    this.webContents.send('tabs-resize');
    setTimeout(() => this.webContents.send('tabs-resize'), 500);
  }

  private close() {
    this.windowState.isMaximized = this.browserWindow.isMaximized();
    this.windowState.isFullscreen = this.browserWindow.isFullScreen();
    storage.windowState = this.windowState;
    storage.persistAll();
    this.browserWindow.setBrowserView(null);

    Application.instance.overlayManager.destroy();
    Object.values(this.tabsById).forEach(x => x.destroy());

    Window.list = Window.list.filter(x => x.browserWindow.id !== this.browserWindow.id);
    if (this.webContents.isDevToolsOpened) {
      this.webContents.closeDevTools();
    }
  }

  public static create(replayApi?: ReplayApi) {
    const window = new Window(replayApi);
    this.list.push(window);
  }
}
