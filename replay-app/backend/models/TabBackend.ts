import { BrowserView } from 'electron';
import { URL } from 'url';
import { v1 as uuidv1 } from 'uuid';
import * as http from 'http';
import Window from './Window';
import generateContextMenu from '../menus/generateContextMenu';
import ITabLocation, { InternalLocations } from '~shared/interfaces/ITabLocation';
import InternalServer from '~shared/constants/files';
import ReplayApi from '~backend/ReplayApi';
import IRectangle from '~shared/interfaces/IRectangle';
import Application from '~backend/Application';
import Rectangle = Electron.Rectangle;

const domReplayerScript = require.resolve('../../injected-scripts/domReplayer');

interface IAddressBarOptions {
  location?: ITabLocation;
  replayApi?: ReplayApi;
}

export default class TabBackend {
  public browserView: BrowserView;
  public replayApi: ReplayApi;

  public favicon = '';
  public findInfo = {
    occurrences: '0/0',
    text: '',
  };

  private bounds: Rectangle;
  private location: InternalLocations = InternalLocations.Home;

  private readonly window: Window;

  public constructor(window: Window, { location, replayApi }: IAddressBarOptions) {
    this.browserView = new BrowserView({
      webPreferences: {
        preload: domReplayerScript,
        nodeIntegration: true,
        contextIsolation: false,
        javascript: true,
        enableRemoteModule: true,
        partition: uuidv1(),
        nativeWindowOpen: true,
        webSecurity: true,
        // sandbox: true, // ToDo: turn this back on for snapshots
      },
    });

    (this.webContents as any).windowId = window.browserWindow.id;

    this.window = window;
    this.browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false,
    });

    this.bindProxy();
    this.bindListeners();
    this.updateAddressBar({ location, replayApi }, true);
  }

  public get webContents() {
    return this.browserView.webContents;
  }

  public get title() {
    return this.webContents.getTitle();
  }

  public get id() {
    return this.webContents.id;
  }

  public get isSelected() {
    return this.id === this.window.tabManager.selectedId;
  }

  public updateAddressBar({ location, replayApi }: IAddressBarOptions, isNewTab: boolean = false) {
    if (this.browserView.isDestroyed()) return;

    if (!isNewTab && this.window.tabManager.selectedId !== this.id) return;
    if (isNewTab && !replayApi) location = InternalLocations.NewTab;

    if (this.replayApi) {
      this.replayApi.removeAllListeners('session:updated');
      this.replayApi.isActive = false;
    }

    const tabUpdateParams: any = { id: this.id, currentTickValue: 0 };
    if (location) {
      tabUpdateParams.location = location;
      location = location === InternalLocations.NewTab ? InternalLocations.Home : location;
      this.location = location as InternalLocations;
      this.webContents
        .loadURL(`${InternalServer.url}/${location.toLowerCase()}`)
        .then(x => this.send('clicks:enable', true));
      this.replayApi = null;
      this.webContents.closeDevTools();
    } else {
      this.location = InternalLocations.Replay;
      this.window.webContents.session.clearCache();
      tabUpdateParams.saSession = replayApi.saSession;
      this.webContents
        .loadURL(`http://localhost:3333/${InternalLocations.Replay.toLowerCase()}`)
        .then(x => this.send('clicks:enable', false));
      this.replayApi = replayApi;
      this.replayApi.on('session:updated', this.updateTabSession.bind(this));
      this.webContents.openDevTools({ mode: 'detach' });
    }

    this.window.sendToRenderer('tab:updated', tabUpdateParams);
  }

  public async changeTickOffset(offset: number) {
    this.onTick(offset);
    this.window.sendToRenderer('tab:updated', {
      id: this.id,
      currentTickValue: offset,
    });
  }

  public async onTick(tickValue: number) {
    if (!this.replayApi) return;
    const events = await this.replayApi.setTickValue(tickValue);
    if (!events) return;
    this.send('dom:apply', ...events);
    this.window.sendToRenderer('tab:page-url', { url: this.replayApi.urlOrigin, id: this.id });
  }

  public async onTickHover(rect: IRectangle, tickValue: number) {
    const tick = this.replayApi.saSession.ticks.find(x => x.playbarOffsetPercent === tickValue);
    if (!tick) return;

    const commandLabel = tick.label;
    const commandResult = this.replayApi.saSession.commandResults.find(
      x => x.commandId === tick.commandId,
    );
    Application.instance.overlayManager.show(
      'command-overlay',
      this.window.browserWindow,
      rect,
      commandLabel,
      commandResult,
    );
  }

  public destroy() {
    this.browserView.destroy();
    this.browserView = null;
  }

  public fixBounds(newBounds: { x: number; width: number; y: any; height: number }) {
    const bounds = this.bounds ?? ({} as Rectangle);
    if (
      newBounds.x !== bounds.x ||
      newBounds.y !== bounds.y ||
      newBounds.width !== bounds.width ||
      newBounds.height !== bounds.height
    ) {
      this.browserView.setBounds(newBounds);
      this.bounds = newBounds;
    }
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  public addToWindow() {
    this.window.browserWindow.addBrowserView(this.browserView);
  }

  public removeFromWindow() {
    this.window.browserWindow.removeBrowserView(this.browserView);
  }

  private updateTabSession() {
    if (!this.replayApi) return;
    const tabUpdateParam = {
      id: this.id,
      saSession: this.replayApi.saSession,
    };
    this.window.sendToRenderer('tab:updated', tabUpdateParam);

    if (this.replayApi.saSession.unresponsiveSeconds >= 5) {
      Application.instance.overlayManager.show(
        'message-overlay',
        this.window.browserWindow,
        this.window.browserWindow.getContentBounds(),
        {
          title: 'Did your script hang?',
          message: `The last update was ${this.replayApi.saSession.unresponsiveSeconds} seconds ago.`,
        },
      );
    } else {
      Application.instance.overlayManager.getByName('message-overlay').hide();
    }
  }

  private bindProxy() {
    const session = this.webContents.session;
    session.protocol.interceptHttpProtocol('http', (request, callback) => {
      const parsedUrl = new URL(request.url, InternalServer.url);
      if (InternalServer.url.includes(parsedUrl.host)) {
        callback({ url: request.url });
      } else if (parsedUrl.host === 'localhost:3333' && parsedUrl.pathname === '/replay') {
        callback({ url: `${InternalServer.url}/replay.html` });
      } else {
        const requestUrl = new URL(request.url);
        const cleanedUrl = new URL(
          requestUrl.pathname + requestUrl.search,
          this.replayApi.urlOrigin,
        );
        const resourceUrl = this.replayApi.resourceUrl(cleanedUrl.href);
        callback({ url: resourceUrl });
      }
    });
  }

  private bindListeners() {
    this.webContents.on('context-menu', (e, params) => {
      generateContextMenu(this.window, params, this.webContents).popup();
    });

    // this.webContents.addListener('found-in-page', (e, result) => {
    //   Application.instance.overlayManager
    //     .getByName('find')
    //     .browserView.webContents.send('found-in-page', result);
    // });

    this.webContents.addListener('did-start-loading', () => {
      this.window.sendToRenderer('tab:updated-loading', this.id, true);
    });

    this.webContents.addListener('did-stop-loading', () => {
      this.window.sendToRenderer('tab:updated-loading', this.id, false);
    });
  }
}
