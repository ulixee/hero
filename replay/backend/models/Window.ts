import { BrowserWindow, app } from 'electron';
import { resolve } from 'path';
import Application from '../Application';
import TabManager from '../managers/TabManager';
import ReplayApi from '~backend/ReplayApi';
import storage from '../storage';
import InternalServer from '~shared/constants/files';

export default class Window {
  public browserWindow: BrowserWindow;
  public tabManager: TabManager;
  public pendingReplayApi: ReplayApi;

  private readonly windowState: any = {};

  public constructor(pendingReplayApi: ReplayApi) {
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

    this.tabManager = new TabManager(this);
    this.loadSavedState();
    this.browserWindow.show();

    this.bindListenersToWindow();

    this.browserWindow.loadURL(`${InternalServer.url}/app`);
    if (process.env.NODE_ENV === 'development') {
      this.webContents.openDevTools({ mode: 'detach' });
    }
  }

  public get id() {
    return this.browserWindow.id;
  }

  public get webContents() {
    return this.browserWindow.webContents;
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
    const { title } = this.tabManager.selected;
    this.browserWindow.setTitle(title.trim() === '' ? app.name : `${title} - ${app.name}`);
  }

  private bindListenersToWindow() {
    this.browserWindow.on('enter-full-screen', () => {
      this.sendToRenderer('fullscreen', true);
      this.tabManager.fixBounds();
    });

    this.browserWindow.on('leave-full-screen', () => {
      this.sendToRenderer('fullscreen', false);
      this.tabManager.fixBounds();
    });

    this.browserWindow.on('enter-html-full-screen', () => {
      this.tabManager.fullscreen = true;
      this.sendToRenderer('html-fullscreen', true);
    });

    this.browserWindow.on('leave-html-full-screen', () => {
      this.tabManager.fullscreen = false;
      this.sendToRenderer('html-fullscreen', false);
    });

    this.browserWindow.on('scroll-touch-begin', () => {
      this.sendToRenderer('scroll-touch-begin');
    });

    this.browserWindow.on('scroll-touch-end', () => {
      this.tabManager.selected.send('scroll-touch-end');
      this.sendToRenderer('scroll-touch-end');
    });

    this.browserWindow.on('focus', () => {
      Application.instance.windowManager.current = this;
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
    setTimeout(() => {
      if (process.platform === 'linux') {
        this.tabManager.select(this.tabManager.selectedId);
      } else {
        this.tabManager.fixBounds();
      }
    }, 0);

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

    this.tabManager.clear();

    Application.instance.windowManager.list = Application.instance.windowManager.list.filter(
      x => x.browserWindow.id !== this.browserWindow.id,
    );
  }
}
