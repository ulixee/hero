import { EventEmitter } from 'events';
import TabBackend from '../models/TabBackend';
import Window from '../models/Window';
import InternalServer from '~shared/constants/files';
import ICreateTabOptions from '~shared/interfaces/ICreateTabOptions';
import { defaultTabOptions } from '~shared/constants/tabs';
import ITabMeta from '~shared/interfaces/ITabMeta';

export default class TabManager extends EventEmitter {
  public byId = new Map<number, TabBackend>();
  public selectedId = 0;
  public _fullscreen = false;
  private readonly window: Window;

  public constructor(window: Window) {
    super();

    this.window = window;
    this.setBoundsListener();
  }

  public get fullscreen() {
    return this._fullscreen;
  }

  public set fullscreen(val: boolean) {
    this._fullscreen = val;
    this.fixBounds();
  }

  public get selected() {
    return this.byId.get(this.selectedId);
  }

  public get settingsView() {
    return Object.values(this.byId).find(r => r.url.startsWith(`${InternalServer.url}/settings`));
  }

  public createTab(opts: ICreateTabOptions, isNext = false, notifyRenderer = true) {
    let options;
    if (!opts && this.window.pendingReplayApi) {
      options = { active: true, replayApi: this.window.pendingReplayApi };
      delete this.window.pendingReplayApi;
    } else if (!opts) {
      options = defaultTabOptions;
    } else {
      options = { ...opts };
    }
    const { location, replayApi, active, index } = options;
    const tab = new TabBackend(this.window, { location, replayApi });
    const { webContents } = tab.browserView;
    const { id } = tab;

    this.byId.set(id, tab);

    webContents.once('destroyed', () => {
      this.byId.delete(id);
    });

    const saSession = replayApi ? replayApi.saSession : undefined;
    const tabMeta: ITabMeta = { id, location, saSession, active, index };
    if (notifyRenderer) {
      this.window.sendToRenderer('insert-tab', { ...tabMeta }, isNext, id);
    }

    return tabMeta;
  }

  public clear() {
    this.window.browserWindow.setBrowserView(null);
    Object.values(this.byId).forEach(x => x.destroy());
  }

  public select(id: number) {
    const tab = this.byId.get(id);
    if (!tab) return;

    if (this.selectedId === id) return;

    if (this.selected) {
      this.selected.removeFromWindow();
    }

    this.selectedId = id;

    tab.addToWindow();
    this.window.webContents.focus();
    this.window.updateTitle();

    this.fixBounds();

    this.emit('activated', id);
  }

  public async fixBounds() {
    const tab = this.selected;
    if (!tab) return;

    const { width, height } = this.window.browserWindow.getContentBounds();
    const toolbarContentHeight = await this.window.browserWindow.webContents.executeJavaScript(`
      document.getElementsByTagName('body')[0].offsetHeight
    `);

    const newBounds = {
      x: 0,
      y: this.fullscreen ? 0 : toolbarContentHeight,
      width,
      height: this.fullscreen ? height : height - toolbarContentHeight,
    };

    tab.fixBounds(newBounds);
  }

  public destroy(id: number) {
    const tab = this.byId.get(id);

    this.byId.delete(id);

    if (tab && !tab.browserView.isDestroyed()) {
      this.window.browserWindow.removeBrowserView(tab.browserView);
      tab.destroy();
      this.emit('removed', id);
    }
  }

  private setBoundsListener() {
    // resize the BrowserView's height when the toolbar height changes
    this.window.webContents.executeJavaScript(`
        const {ipcRenderer} = require('electron');
        const resizeObserver = new ResizeObserver(([{ contentRect }]) => {
          ipcRenderer.send('resize-height');
        });
        const app = document.getElementsByTagName('body')[0];
        resizeObserver.observe(app);
      `);

    this.window.webContents.on('ipc-message', (e, message) => {
      if (message === 'resize-height') {
        this.fixBounds();
      }
    });
  }
}
