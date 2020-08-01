import * as Path from 'path';
import { app, dialog, ipcMain, Menu } from 'electron';
import OverlayManager from './managers/OverlayManager';
import generateAppMenu from './menus/generateAppMenu';
import { loadNuxt } from 'nuxt-start';
import ReplayApi from './ReplayApi';
import storage from './storage';
import Window from './models/Window';
import { ChildProcess } from 'child_process';
import InternalServer from '~shared/constants/files';

export default class Application {
  public static instance = new Application();
  public overlayManager = new OverlayManager();

  private replayApiProcess: ChildProcess;

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
      if (this.replayApiProcess) this.replayApiProcess.kill();

      storage.persistAll();
    });

    this.bindEventHandlers();

    await this.startNuxt();
    await app.whenReady();
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
    const listener = await nuxt.listen(0);
    InternalServer.url = listener.url;
  }

  private async loadLocationFromArgv(argv: string[]) {
    const args = argv.slice(2);
    console.log('Launched with args', argv);
    if (!args.length) {
      await this.startLocalApi();
      this.createWindowIfNeeded();
      return;
    }
    const [dataLocation, sessionName, scriptInstanceId, replayApiPackagePath] = args;

    await this.startLocalApi(replayApiPackagePath);
    await this.loadSessionReplay(dataLocation, sessionName, scriptInstanceId);
  }

  private async startLocalApi(replayApiPackagePath?: string) {
    if (this.replayApiProcess) return;
    this.replayApiProcess = await ReplayApi.start(
      replayApiPackagePath ?? Path.resolve(__dirname, '../../replay-api/start'),
    );
  }

  private createWindowIfNeeded() {
    if (Window.list.filter(x => x !== null).length === 0) {
      Window.create();
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
    if (Window.list.filter(x => x !== null).length === 0) {
      Window.create(replayApi);
      return;
    }

    // ToDo: need to search windows/tabs for same session
    const window = Window.current;
    if (useCurrentTab) {
      window.openReplayApi(replayApi);
    } else {
      window.createReplayTab(replayApi);
    }
  }

  private bindEventHandlers() {
    ipcMain.setMaxListeners(0);

    // WINDOWS

    ipcMain.on('window:create', () => {
      Window.create();
    });

    ipcMain.on('window:focus', () => {
      Window.current.browserWindow.focus();
      Window.current.webContents.focus();
    });

    ipcMain.on('window:toggle-maximize', () => {
      const window = Window.current;
      if (window.browserWindow.isMaximized()) {
        window.browserWindow.unmaximize();
      } else {
        window.browserWindow.maximize();
      }
    });

    ipcMain.on('window:toggle-minimize', () => {
      const window = Window.current;
      window.browserWindow.minimize();
    });

    ipcMain.on('window:close', () => {
      const window = Window.current;
      window.browserWindow.close();
    });

    ipcMain.on('window:fix-dragging', () => {
      const window = Window.current;
      window.fixDragging();
    });

    // TABS

    ipcMain.handle('tab:create', (e, options, sendToRenderer) => {
      return Window.current.createAppTab(options, false, sendToRenderer);
    });

    ipcMain.on('tab:print', (e, details) => {
      Window.current.selectedTab.webContents.print();
    });

    ipcMain.handle('tab:select', (e, tabId: number) => {
      Window.current.selectedTabId = tabId;
    });

    ipcMain.on('tab:destroy', (e, tabId: number) => {
      Window.current.destroyTab(tabId);
    });

    ipcMain.on('tab:reload', (e, tabId: number) => {
      Window.current.selectedTab.webContents.reload();
    });

    // OVERLAYS

    ipcMain.on('overlay:toggle', (e, name, rect) => {
      const browserWindow = Window.current.browserWindow;
      this.overlayManager.toggle(name, browserWindow, rect);
    });

    ipcMain.on('overlay:show', (e, name, rect, ...args) => {
      const browserWindow = Window.current.browserWindow;
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
      const currentWindow = Window.current;
      if (useCurrentTab) {
        currentWindow.openAppLocation(location);
      } else {
        currentWindow.createAppTab({ location, active: true });
      }
    });

    ipcMain.on('navigate-to-history', async (e, item, useCurrentTab) => {
      const { dataLocation, sessionName, scriptInstanceId } = item;
      await this.loadSessionReplay(dataLocation, sessionName, scriptInstanceId, useCurrentTab);
    });

    ipcMain.on('navigate-to-session-page', async (e, page: { id: string; url: string }) => {
      const replayTab = Window.current?.selectedReplayTab;
      if (!replayTab) return;
      const offset = replayTab.replayApi.getPageOffset(page);
      replayTab.changeTickOffset(offset);
    });

    ipcMain.on('on-tick', (e, tickValue) => {
      const replayTab = Window.current?.selectedReplayTab;
      if (!replayTab) return;
      replayTab.onTick(tickValue);
    });

    ipcMain.on('on-tick-hover', (e, containerRect, tickValue) => {
      const replayTab = Window.current?.selectedReplayTab;
      if (!replayTab) return;
      replayTab.onTickHover(containerRect, tickValue);
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
      const window = Window.current;
      window.sendToRenderer('find');
    });

    ipcMain.handle('fetch-history', () => {
      return storage.fetchHistory();
    });

    ipcMain.handle('fetch-script-instances', () => {
      const replayTab = Window.current?.selectedReplayTab;
      if (!replayTab) return;

      const replayApi = replayTab.replayApi;
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
      const replayApi = Window.current.selectedReplayTab?.replayApi;
      if (!replayApi) return;
      return replayApi.saSession.relatedSessions;
    });

    ipcMain.handle('fetch-session-pages', () => {
      const replayApi = Window.current.selectedReplayTab?.replayApi;
      if (!replayApi) return;
      return replayApi.saSession.pages.map(x => {
        return {
          ...x,
          isActive: replayApi.urlOrigin === x.url || `${replayApi.urlOrigin}/` === x.url,
        };
      });
    });
  }
}
