import * as Path from 'path';
import { app, dialog, ipcMain, Menu, protocol } from 'electron';
import * as Fs from 'fs';
import OverlayManager from './managers/OverlayManager';
import generateAppMenu from './menus/generateAppMenu';
import ReplayApi from './api';
import storage from './storage';
import Window from './models/Window';
import IReplayMeta from '../shared/interfaces/IReplayMeta';

// NOTE: this has to come before app load
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

    const replayMeta: IReplayMeta = {} as any;
    for (const arg of args) {
      if (!arg || !arg.startsWith('--replay')) continue;
      const [key, val] = arg.split('=');
      let value = val;
      if (value.startsWith('"')) {
        value = value.slice(1, value.length - 1);
      }
      if (key === '--replay-data-location') {
        replayMeta.dataLocation = value;
      }
      if (key === '--replay-session-name') {
        replayMeta.sessionName = value;
      }
      if (key === '--replay-script-instance-id') {
        replayMeta.scriptInstanceId = value;
      }
      if (key === '--replay-session-id') {
        replayMeta.sessionId = value;
      }
      if (key === '--replay-api-server') {
        replayMeta.sessionStateApi = value;
      }
      if (key === '--replay-api-path') {
        ReplayApi.serverStartPath = value;
      }
    }

    await this.loadSessionReplay(replayMeta, true);
  }

  private createWindowIfNeeded() {
    if (Window.noneOpen()) {
      Window.create();
    }
  }

  private async loadSessionReplay(replay: IReplayMeta, findOpenReplayScriptWindow = false) {
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

    if (findOpenReplayScriptWindow) {
      const match = Window.list.find(
        x => x.replayApi?.saSession?.scriptEntrypoint === replay.scriptEntrypoint,
      );
      if (match) return match.openReplayApi(replayApi);
    }

    if (Window.noneOpen()) {
      return Window.create({ replayApi });
    }

    await Window.current.openReplayApi(replayApi);
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

    ipcMain.on('window:print', () => {
      Window.current.activeView.webContents.print();
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

    // GOTO
    ipcMain.on('go-back', () => {
      Window.current.goBack();
    });

    ipcMain.on('go-forward', () => {
      Window.current.goForward();
    });

    ipcMain.on('navigate-to-location', (e, location) => {
      Window.current.openAppLocation(location);
    });

    ipcMain.on('navigate-to-history', async (e, replayMeta) => {
      await this.loadSessionReplay(replayMeta);
    });

    ipcMain.on('navigate-to-session', () => {});

    ipcMain.on('navigate-to-session-tab', (e, tab: { id: string }) => {
      Window.current?.loadReplayTab(tab.id);
    });

    // TICKS
    let tickDebounce: NodeJS.Timeout;
    ipcMain.on('on-tick', (e, tickValue) => {
      clearTimeout(tickDebounce);
      const replayView = Window.current?.replayView;
      if (!replayView) return;
      tickDebounce = setTimeout(() => replayView.onTick(tickValue), 10);
    });

    ipcMain.handle('next-tick', () => {
      return Window.current?.replayView?.nextTick();
    });

    ipcMain.on('on-tick-hover', (e, containerRect, tickValue) => {
      Window.current?.replayView?.onTickHover(containerRect, tickValue);
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
          return this.loadSessionReplay({ dataLocation: filename });
        }
        let sessionContainerDir = Path.dirname(filename);
        while (Fs.existsSync(sessionContainerDir)) {
          const sessionsDir = Fs.existsSync(`${sessionContainerDir}/.sessions`);
          if (sessionsDir) {
            return this.loadSessionReplay({
              dataLocation: `${sessionContainerDir}/.sessions`,
              scriptEntrypoint: filename,
            });
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
