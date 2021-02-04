import * as Path from 'path';
import * as Os from 'os';
import { app, dialog, ipcMain, Menu, protocol } from 'electron';
import * as Fs from 'fs';
import OverlayManager from './managers/OverlayManager';
import generateAppMenu from './menus/generateAppMenu';
import ReplayApi from './api';
import storage from './storage';
import Window from './models/Window';
import IReplayMeta from '../shared/interfaces/IReplayMeta';
import ScriptRegistrationServer from '~backend/api/ScriptRegistrationServer';

// NOTE: this has to come before app load
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

export default class Application {
  public static instance = new Application();
  public static devServerUrl = process.env.WEBPACK_DEV_SERVER_URL;
  public overlayManager = new OverlayManager();
  public registrationServer: ScriptRegistrationServer;

  public async start() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      console.log('CLOSING SECOND APP');
    });

    app.on('quit', () => {
      ReplayApi.quit();
      this.registrationServer?.close();

      storage.persistAll();
    });

    this.bindEventHandlers();

    await app.whenReady();
    this.registerFileProtocol();
    await this.overlayManager.start();
    console.log('Launched with args', process.argv);
    this.registrationServer = new ScriptRegistrationServer(this.registerScript.bind(this));
    Menu.setApplicationMenu(generateAppMenu());

    const defaultNodePath = process.argv.find(x => x.startsWith('--sa-default-node-path='));

    if (defaultNodePath) {
      const nodePath = defaultNodePath.split('--sa-default-node-path=').pop();
      console.log('Default nodePath provided', nodePath);
      ReplayApi.nodePath = nodePath;
    }

    if (!process.argv.includes('--sa-replay')) {
      this.createWindowIfNeeded();
    }
  }

  public getPageUrl(page: string) {
    if (Application.devServerUrl) {
      return new URL(page, Application.devServerUrl).href;
    }
    return `app://./${page}.html`;
  }

  public async registerScript(replayMeta: IReplayMeta) {
    if (this.shouldAppendToOpenReplayScript(replayMeta)) return;

    const window = await this.loadSessionReplay(replayMeta, true);
    window?.replayOnFocus();
  }

  private shouldAppendToOpenReplayScript(replay: IReplayMeta) {
    const { scriptInstanceId, scriptStartDate } = replay;
    const windowWithScriptRun = Window.list.find(x => {
      const session = x.replayApi?.saSession;
      if (!session) return false;
      return (
        session.scriptInstanceId === scriptInstanceId &&
        session.scriptStartDate === scriptStartDate &&
        // make sure this isn't the current id
        session.id !== replay.sessionId
      );
    });
    if (windowWithScriptRun) {
      windowWithScriptRun.addRelatedSession({ id: replay.sessionId, name: replay.sessionName });
      console.log('Adding session to script instance', { replay });
      return true;
    }
    return false;
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
      dialog.showErrorBox(`Unable to Load Replay`, err.message ?? String(err));
      return;
    }

    storage.addToHistory({
      dataLocation: replayApi.saSession.dataLocation,
      sessionName: replayApi.saSession.name,
      scriptInstanceId: replayApi.saSession.scriptInstanceId,
      scriptEntrypoint: replayApi.saSession.scriptEntrypoint,
    });

    let existingWindow = Window.current;
    if (findOpenReplayScriptWindow) {
      existingWindow = Window.list.find(
        x => x.replayApi?.saSession?.scriptEntrypoint === replayApi.saSession.scriptEntrypoint,
      );
    }

    if (!existingWindow && Window.current?.isReplayActive === false) {
      existingWindow = Window.current;
    }

    if (!existingWindow) {
      return Window.create({ replayApi });
    }

    await existingWindow.openReplayApi(replayApi);
    return existingWindow;
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

    ipcMain.on('message-overlay:hide', (e, webContentsId, messageId) => {
      this.overlayManager.getByWebContentsId(webContentsId).hide();
      Window.current.hideMessageOverlay(messageId);
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

    ipcMain.on('navigate-to-session', (e, session: { id: string; name: string }) => {
      const current = Window.current.replayApi.saSession;
      const replayMeta: IReplayMeta = {
        sessionId: session.id,
        sessionName: session.name,
        scriptInstanceId: current.scriptInstanceId,
        dataLocation: current.dataLocation,
      };
      console.log('navigate-to-session', replayMeta);
      return this.loadSessionReplay(replayMeta, true);
    });

    ipcMain.on('navigate-to-session-tab', (e, tab: { id: string }) => {
      Window.current?.loadReplayTab(tab.id);
    });

    // TICKS
    let tickDebounce: NodeJS.Timeout;
    ipcMain.on('on-tick-drag', (e, tickValue) => {
      clearTimeout(tickDebounce);
      const replayView = Window.current?.replayView;
      if (!replayView) return;
      tickDebounce = setTimeout(() => replayView.onTickDrag(tickValue), 10);
    });

    ipcMain.handle('next-tick', (e, startMillisDeficit) => {
      return Window.current?.replayView?.nextTick(startMillisDeficit);
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
        defaultPath: Path.join(Os.tmpdir(), '.secret-agent'),
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
