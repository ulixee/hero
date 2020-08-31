import * as Path from 'path';
import { app, dialog, ipcMain, Menu, protocol } from 'electron';
import * as Fs from 'fs';
import OverlayManager from './managers/OverlayManager';
import generateAppMenu from './menus/generateAppMenu';
import ReplayApi from './api';
import storage from './storage';
import Window from './models/Window';
import IReplayMeta from '../shared/interfaces/IReplayMeta';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

export default class Application {
  public static instance = new Application();
  public static devServerUrl = process.env.WEBPACK_DEV_SERVER_URL;
  public overlayManager = new OverlayManager();

  public async start() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', async (e, argv) => {
      await this.loadLocationFromArgv(argv);
    });

    app.on('quit', () => {
      ReplayApi.quit();

      storage.persistAll();
    });

    this.bindEventHandlers();

    await app.whenReady();
    this.registerFileProtocol();
    await this.overlayManager.start();
    await this.loadLocationFromArgv(process.argv);

    Menu.setApplicationMenu(generateAppMenu());
  }

  public getPageUrl(page: string) {
    if (Application.devServerUrl) {
      return new URL(page, Application.devServerUrl).href;
    }
    return `app://./${page}.html`;
  }

  private async loadLocationFromArgv(argv: string[]) {
    const args = argv.slice(2);
    console.log('Launched with args', argv.slice(2));
    if (!args.length) {
      return this.createWindowIfNeeded();
    }

    const [
      dataLocation,
      sessionName,
      scriptInstanceId,
      sessionId,
      sessionStateApi,
      replayApiPackagePath,
    ] = args;

    ReplayApi.serverStartPath = replayApiPackagePath;

    await this.loadSessionReplay({
      dataLocation,
      sessionName,
      sessionId,
      scriptInstanceId,
      sessionStateApi,
    });
  }

  private createWindowIfNeeded() {
    if (Window.noneOpen()) {
      Window.create();
    }
  }

  private async loadSessionReplay(replay: IReplayMeta, useCurrentTab = false) {
    let replayApi: ReplayApi;
    try {
      replayApi = await ReplayApi.connect(replay);
    } catch (err) {
      console.log('ERROR launching replay', err);
      dialog.showErrorBox('Whoops, something blew up loading this replay!', err.stack);
      return;
    }

    storage.addToHistory({
      dataLocation: replayApi.saSession.dataLocation,
      sessionName: replayApi.saSession.name,
      scriptInstanceId: replayApi.saSession.scriptInstanceId,
      scriptEntrypoint: replayApi.saSession.scriptEntrypoint,
    });

    if (Window.noneOpen()) {
      return Window.create(replayApi);
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

    app.on('activate', () => {
      // triggered when clicking icon on OS taskbar
      this.createWindowIfNeeded();
    });

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

    ipcMain.on('tab:print', () => {
      Window.current.selectedTab.webContents.print();
    });

    ipcMain.handle('tab:select', (e, tabId: number) => {
      Window.current.selectedTabId = tabId;
    });

    ipcMain.on('tab:destroy', (e, tabId: number) => {
      Window.current.destroyTab(tabId);
    });

    ipcMain.on('tab:reload', () => {
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

    ipcMain.on('navigate-to-history', async (e, replayMeta, useCurrentTab) => {
      await this.loadSessionReplay(replayMeta, useCurrentTab);
    });

    ipcMain.on('navigate-to-session-page', async (e, page: { id: number; url: string }) => {
      const replayTab = Window.current?.selectedReplayTab;
      if (!replayTab) return;
      const offset = replayTab.replayApi.state.getPageOffset(page);
      replayTab.changeTickOffset(offset);
    });

    let tickDebounce: NodeJS.Timeout;
    ipcMain.on('on-tick', (e, tickValue) => {
      clearTimeout(tickDebounce);
      const replayTab = Window.current?.selectedReplayTab;
      if (!replayTab) return;
      tickDebounce = setTimeout((tab, val) => tab.onTick(val), 10, replayTab, tickValue);
    });

    ipcMain.handle('next-tick', () => {
      const replayTab = Window.current?.selectedReplayTab;
      if (!replayTab) return;
      return replayTab.nextTick();
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
        properties: ['openFile', 'showHiddenFiles'],
        filters: [
          { name: 'All Files', extensions: ['js', 'ts', 'db'] },
          { name: 'Session Database', extensions: ['db'] },
          { name: 'Javascript', extensions: ['js'] },
          { name: 'Typescript', extensions: ['ts'] },
        ],
      });
      if (result.filePaths.length) {
        const [filename] = result.filePaths;
        if (filename.endsWith('.db')) {
          return this.loadSessionReplay({ dataLocation: filename }, true);
        }
        let sessionContainerDir = Path.dirname(filename);
        while (Fs.existsSync(sessionContainerDir)) {
          const sessionsDir = Fs.existsSync(`${sessionContainerDir}/.sessions`);
          if (sessionsDir) {
            return this.loadSessionReplay(
              {
                dataLocation: `${sessionContainerDir}/.sessions`,
                scriptEntrypoint: filename,
              },
              true,
            );
          }
          sessionContainerDir = Path.resolve(sessionContainerDir, '..');
        }
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
          dataLocation: replayApi.saSession.dataLocation,
          sessionName: replayApi.saSession.name,
        };
      });
    });

    ipcMain.handle('fetch-sessions', () => {
      const replayApi = Window.current?.selectedReplayTab?.replayApi;
      if (!replayApi) return;
      return replayApi.saSession.relatedSessions;
    });

    ipcMain.handle('fetch-session-pages', () => {
      const replayApi = Window.current.selectedReplayTab?.replayApi;
      if (!replayApi) return;
      return replayApi.state.pages.map(x => {
        return {
          ...x,
          isActive:
            replayApi.state.urlOrigin === x.url || `${replayApi.state.urlOrigin}/` === x.url,
        };
      });
    });
  }

  private registerFileProtocol() {
    protocol.registerBufferProtocol('app', async (request, respond) => {
      let pathName = new URL(request.url).pathname;
      pathName = decodeURI(pathName); // Needed in case URL contains spaces
      const filePath = Path.join(app.getAppPath(), 'frontend', pathName);

      try {
        const data = await Fs.promises.readFile(filePath);
        const extension = Path.extname(pathName).toLowerCase();
        let mimeType = '';

        if (extension === '.js') {
          mimeType = 'text/javascript';
        } else if (extension === '.html') {
          mimeType = 'text/html';
        } else if (extension === '.css') {
          mimeType = 'text/css';
        } else if (extension === '.svg' || extension === '.svgz') {
          mimeType = 'image/svg+xml';
        } else if (extension === '.json') {
          mimeType = 'application/json';
        }

        respond({ mimeType, data });
      } catch (error) {
        if (error) {
          console.error(`Failed to read ${pathName} on app protocol`, error);
        }
      }
    });
  }
}
