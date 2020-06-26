import { BrowserView, app } from 'electron';
import { URL } from 'url';
import * as Path from 'path';
import uuid from 'uuid/v1';
import * as http from 'http';
import Window from './Window';
import generateContextMenu from '../menus/generateContextMenu';
import ITabLocation, { InternalLocations } from '~shared/interfaces/ITabLocation';
import { INTERNAL_BASE_URL } from '~shared/constants/files';
import ITabMeta from '~shared/interfaces/ITabMeta';
import ReplayApi from '~backend/ReplayApi';

const domReplayerScript = Path.join(app.getAppPath(), '..', 'injected-scripts/domReplayer.js');

interface IAddressBarOptions {
  location?: ITabLocation;
  replayApi?: ReplayApi;
}

export default class TabBackend {
  public browserView: BrowserView;
  public replayApi: ReplayApi;

  public favicon = '';
  public bounds: any;

  public findInfo = {
    occurrences: '0/0',
    text: '',
  };

  private urlOrigin: string;
  private readonly window: Window;

  public constructor(window: Window, { location, replayApi }: IAddressBarOptions) {
    this.browserView = new BrowserView({
      webPreferences: {
        preload: domReplayerScript,
        nodeIntegration: true,
        contextIsolation: false,
        javascript: true,
        enableRemoteModule: true,
        partition: uuid(),
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

    if (this.replayApi) {
      replayApi.removeAllListeners('session:updated');
    }

    const tabUpdateParams: any = { id: this.id };
    if (location) {
      tabUpdateParams.location = location;
      location = location === InternalLocations.NewTab ? InternalLocations.Home : location;
      this.webContents.loadURL(`${INTERNAL_BASE_URL}/${location.toLowerCase()}`);
      this.replayApi = null;
    } else {
      tabUpdateParams.saSession = replayApi.saSession;
      this.webContents.loadURL(`http://localhost:3333/${InternalLocations.Replay.toLowerCase()}`);
      this.replayApi = replayApi;
      replayApi.on('session:updated', () => {
        tabUpdateParams.saSession = replayApi.saSession;
        this.window.sendToRenderer('tab:updated', tabUpdateParams);
      });
    }

    this.window.sendToRenderer('tab:updated', tabUpdateParams);
  }

  public async replayPaintEvent(paintEventIdx) {
    const paintEvents = await this.replayApi.fetchPaintEvents(0, paintEventIdx);
    const changeEvents = [];
    let newUrlOrigin: string;
    for (const paintEvent of paintEvents) {
      changeEvents.push(...paintEvent.changeEvents);
      newUrlOrigin = paintEvent.urlOrigin;
    }
    this.urlOrigin = newUrlOrigin;
    this.webContents.send('reset-dom');
    this.webContents.send('apply-dom-changes', changeEvents);
  }

  public destroy() {
    this.browserView.destroy();
    this.browserView = null;
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  private bindProxy() {
    const session = this.webContents.session;
    session.protocol.interceptHttpProtocol('http', (request, callback) => {
      const parsedUrl = new URL(request.url, 'http://localhost:3000/');
      if (parsedUrl.host === 'localhost:3000') {
        callback({ url: request.url });
      } else if (parsedUrl.host === 'localhost:3333' && parsedUrl.pathname === '/replay') {
        callback({ url: 'http://localhost:3000/replay.html' });
      } else {
        const cleanedUrl = request.url.replace('http://localhost:3333', this.urlOrigin);
        const resourceUrl = this.replayApi.resourceUrl(cleanedUrl);
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
