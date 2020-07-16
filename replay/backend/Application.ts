import * as Path from 'path';
import { app, dialog, ipcMain, Menu } from 'electron';
import WindowManager from './managers/WindowManager';
import OverlayManager from './managers/OverlayManager';
import generateAppMenu from './menus/generateAppMenu';
import { loadNuxt } from 'nuxt-start';
import ReplayApi from './ReplayApi';
import storage from './storage';
import ipcRenderer = Electron.ipcRenderer;

export default class Application {
  public static instance = new Application();
  public overlayManager = new OverlayManager();
  public windowManager = new WindowManager();

  public async start() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('activate', () => {
      // triggered when clicking icon on OS taskbar
      this.createWindowIfNeeded();
    });

    app.on('second-instance', async (e, argv) => {
      await this.loadLocationFromArgv(argv);
    });

    app.on('quit', () => {
      storage.persistAll();
    });

    this.bindEventHandlers();

    await app.whenReady();
    await this.startNuxt();
    await this.overlayManager.start();
    await this.loadLocationFromArgv(process.argv);

    Menu.setApplicationMenu(generateAppMenu());
  }

  private async startNuxt() {
    if (process.env.NODE_ENV === 'development') {
      // wait a second for external development nuxt server to load
      await new Promise(resolve => setTimeout(resolve, 2e3));
      return;
    }
    const nuxt = await loadNuxt({
      rootDir: Path.join(__dirname, '../'),
      configFile: 'nuxt.config',
      configContext: { usingBuild: true },
      for: 'start',
    });
    await nuxt.listen(3000);
  }

  private async loadLocationFromArgv(argv) {
    const args = argv.slice(2);
    if (!args.length) {
      this.createWindowIfNeeded();
      return;
    }
    const [dataLocation, sessionName, scriptInstanceId] = args;
    await this.loadSessionReplay(dataLocation, sessionName, scriptInstanceId);
  }

  private createWindowIfNeeded() {
    if (this.windowManager.list.filter(x => x !== null).length === 0) {
      this.windowManager.createWindow();
    }
  }

  private async loadSessionReplay(
    dataLocation: string,
    sessionName: string,
    scriptInstanceId: string,
    useCurrentTab: boolean = false,
  ) {
    const replayApi = await ReplayApi.connect(dataLocation, sessionName, scriptInstanceId);
    storage.addToHistory({
      dataLocation,
      sessionName,
      scriptInstanceId,
      scriptEntrypoint: replayApi.saSession.scriptEntrypoint,
    });
    if (this.windowManager.list.filter(x => x !== null).length === 0) {
      this.windowManager.createWindow(replayApi);
      return;
    }

    // ToDo: need to search windows/tabs for same session
    const { tabManager } = Application.instance.windowManager.current;
    if (useCurrentTab) {
      tabManager.selected.updateAddressBar({ replayApi });
    } else {
      tabManager.createTab({ replayApi, active: true });
    }
  }

  private bindEventHandlers() {
    ipcMain.setMaxListeners(0);

    // WINDOWS

    ipcMain.on('window:create', () => {
      this.windowManager.createWindow();
    });

    ipcMain.on('window:focus', () => {
      this.windowManager.current.browserWindow.focus();
      this.windowManager.current.webContents.focus();
    });

    ipcMain.on('window:toggle-maximize', () => {
      const window = this.windowManager.current;
      if (window.browserWindow.isMaximized()) {
        window.browserWindow.unmaximize();
      } else {
        window.browserWindow.maximize();
      }
    });

    ipcMain.on('window:toggle-minimize', () => {
      const window = this.windowManager.current;
      window.browserWindow.minimize();
    });

    ipcMain.on('window:close', () => {
      const window = this.windowManager.current;
      window.browserWindow.close();
    });

    ipcMain.on('window:fix-dragging', () => {
      const window = this.windowManager.current;
      window.fixDragging();
    });

    // TABS

    ipcMain.handle('tab:create', (e, options, sendToRenderer) => {
      const tabManager = this.windowManager.current.tabManager;
      return tabManager.createTab(options, false, sendToRenderer);
    });

    ipcMain.on('tab:print', (e, details) => {
      const tabManager = this.windowManager.current.tabManager;
      tabManager.byId.get(tabManager.selectedId).webContents.print();
    });

    ipcMain.handle('tab:select', (e, tabId: number) => {
      const tabManager = this.windowManager.current.tabManager;
      tabManager.select(tabId);
    });

    ipcMain.on('tab:destroy', (e, tabId: number) => {
      const tabManager = this.windowManager.current.tabManager;
      tabManager.destroy(tabId);
    });

    ipcMain.on('tab:reload', (e, tabId: number) => {
      const tabManager = this.windowManager.current.tabManager;
      tabManager.byId.get(tabManager.selectedId).webContents.reload();
    });

    // OVERLAYS

    ipcMain.on('overlay:toggle', (e, name, rect) => {
      const browserWindow = Application.instance.windowManager.current.browserWindow;
      this.overlayManager.toggle(name, browserWindow, rect);
    });

    ipcMain.on('overlay:show', (e, name, rect, ...args) => {
      const browserWindow = Application.instance.windowManager.current.browserWindow;
      this.overlayManager.show(name, browserWindow, rect, ...args);
    });

    ipcMain.on('overlay:hide', (e, webContentsId) => {
      this.overlayManager.getByWebContentsId(webContentsId).hide();
    });

    ipcMain.handle('overlay:is-visible', (e, overlay) => {
      return Application.instance.overlayManager.isVisible(overlay);
    });

    // GOTO

    ipcMain.on('navigate-to-location', (e, location, useCurrentTab) => {
      const { tabManager } = Application.instance.windowManager.current;
      if (useCurrentTab) {
        tabManager.selected.updateAddressBar({ location });
      } else {
        tabManager.createTab({ location, active: true });
      }
    });

    ipcMain.on('navigate-to-history', async (e, item, useCurrentTab) => {
      const { dataLocation, sessionName, scriptInstanceId } = item;
      await this.loadSessionReplay(dataLocation, sessionName, scriptInstanceId, useCurrentTab);
    });

    ipcMain.on('navigate-to-session-page', async (e, page: { id: string; url: string }) => {
      const { tabManager } = Application.instance.windowManager.current;
      const offset = tabManager.selected.replayApi.getPageOffset(page);
      tabManager.selected.changeTickOffset(offset);
    });

    ipcMain.on('on-tick', (e, tickValue) => {
      const { tabManager } = Application.instance.windowManager.current;
      tabManager.selected.onTick(tickValue);
    });

    ipcMain.on('on-tick-hover', (e, containerRect, tickValue) => {
      const { tabManager } = Application.instance.windowManager.current;
      tabManager.selected.onTickHover(containerRect, tickValue);
    });

    // SETTINGS

    ipcMain.on('settings:save', (e, { settings }: { settings: string }) => {
      storage.settings = JSON.parse(settings);
    });

    ipcMain.on('settings:fetch', e => {
      e.returnValue = storage.settings;
    });

    // MISC

    ipcMain.on('open-file', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['js', 'ts', 'db'] },
          { name: 'Session Database', extensions: ['db'] },
          { name: 'Javascript', extensions: ['js'] },
          { name: 'Typescript', extensions: ['ts'] },
        ],
      });
      if (result.filePaths.length) {
        // TODO: recurse to sessions directory for this script
      }
    });

    ipcMain.on('find-in-page', () => {
      const window = this.windowManager.current;
      window.sendToRenderer('find');
    });

    ipcMain.handle('fetch-history', () => {
      return storage.fetchHistory();
    });

    ipcMain.handle('fetch-script-instances', () => {
      const tabManager = this.windowManager.current.tabManager;
      const replayApi = tabManager.byId.get(tabManager.selectedId).replayApi;
      return replayApi.saSession.relatedScriptInstances.map(x => {
        return {
          ...x,
          scriptInstanceId: x.id,
          isActive: replayApi.saSession.scriptInstanceId === x.id,
          dataLocation: replayApi.dataLocation,
          sessionName: replayApi.saSession.name,
        };
      });
    });

    ipcMain.handle('fetch-sessions', () => {
      const tabManager = this.windowManager.current.tabManager;
      const replayApi = tabManager.byId.get(tabManager.selectedId).replayApi;
      return replayApi.saSession.relatedSessions;
    });

    ipcMain.handle('fetch-session-pages', () => {
      const tabManager = this.windowManager.current.tabManager;
      const replayApi = tabManager.byId.get(tabManager.selectedId).replayApi;
      return replayApi.saSession.pages.map(x => {
        return {
          ...x,
          isActive: replayApi.urlOrigin === x.url || `${replayApi.urlOrigin}/` === x.url,
        };
      });
    });
  }
}
