import * as Path from 'path';
import { app, dialog, ipcMain, Menu } from 'electron';
import * as Fs from 'fs';
import { app, protocol, dialog, ipcMain, Menu } from 'electron';
import WindowManager from './managers/WindowManager';
import OverlayManager from './managers/OverlayManager';
import generateAppMenu from './menus/generateAppMenu';
import ReplayApi from './ReplayApi';
import storage from './storage';
import Window from './models/Window';
import { ChildProcess } from 'child_process';
import InternalServer from '~shared/constants/files';
import * as Fs from 'fs';
import IReplayMeta from '../shared/interfaces/IReplayMeta';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

export default class Application {
  public static instance = new Application();
  public static devServerUrl = process.env.WEBPACK_DEV_SERVER_URL;
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

    await app.whenReady();
    this.registerFileProtocol();
    await this.overlayManager.start();
    await this.loadLocationFromArgv(process.argv);

    Menu.setApplicationMenu(generateAppMenu());
  }

  public getPageUrl(page: string) {
    if (Application.devServerUrl) {
      console.log('returining page url', new URL(page, Application.devServerUrl).href);
      return new URL(page, Application.devServerUrl).href;
    }
    return `app://./${page}.html`;
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
    await this.loadSessionReplay({ dataLocation, sessionName, scriptInstanceId });
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

  private async loadSessionReplay(replay: IReplayMeta, useCurrentTab = false) {
    const replayApi = await ReplayApi.connect(replay);
    storage.addToHistory({
      dataLocation: replayApi.dataLocation,
      sessionName: replayApi.saSession.name,
      scriptInstanceId: replayApi.saSession.scriptInstanceId,
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

    ipcMain.on('navigate-to-history', async (e, replayMeta, useCurrentTab) => {
      await this.loadSessionReplay(replayMeta, useCurrentTab);
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

  private registerFileProtocol() {
    protocol.registerBufferProtocol('app', async (request, respond) => {
      let pathName = new URL(request.url).pathname;
      pathName = decodeURI(pathName); // Needed in case URL contains spaces
      const filePath = Path.join(app.getAppPath(), 'pages', pathName);

      console.log('getting protocol', request.url, filePath);

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
