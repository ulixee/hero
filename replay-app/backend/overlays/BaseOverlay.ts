import { BrowserView, BrowserWindow } from 'electron';
import IRectangle from '~shared/interfaces/IRectangle';
import Application from '~backend/Application';
import generateContextMenu from '~backend/menus/generateContextMenu';
import Rectangle = Electron.Rectangle;

interface IOptions {
  name: string;
  bounds?: IRectangle;
  calcBounds?: (bounds: IRectangle) => IRectangle;
  customHide?: boolean;
  webPreferences?: Electron.WebPreferences;
  onWindowBoundsUpdate?: () => void;
  maxHeight?: number;
}

export default class BaseOverlay {
  public name: string;
  public browserWindow: BrowserWindow;
  public browserView: BrowserView;
  public visible = false;

  public maxHeight = 500;
  protected lastHeight = 0;
  protected hasNewHeight = true;

  private readonly calcBounds: (bounds: IRectangle) => IRectangle;
  private isReady: Promise<void>;

  public constructor(options: IOptions) {
    const { name, bounds, calcBounds, webPreferences, maxHeight } = options;
    this.browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        ...webPreferences,
      },
    });

    this.browserView.setAutoResize({
      height: true,
      width: true,
    });

    this.calcBounds = calcBounds;
    this.name = name;
    this.maxHeight = maxHeight ?? 500;

    if (bounds) {
      this.browserView.setBounds({
        x: bounds.x ?? 0,
        y: bounds.y ?? 0,
        height: bounds.height ?? this.maxHeight,
        width: bounds.width,
      });
    }
    this.isReady = this.load();
  }

  public get webContents() {
    return this.browserView.webContents;
  }

  public get id() {
    return this.webContents.id;
  }

  public show(
    browserWindow: BrowserWindow,
    options: { focus?: boolean; rect?: IRectangle },
    ...args: any[]
  ) {
    const { focus = true, rect } = options;
    this.browserWindow = browserWindow;

    this.webContents.send('will-show', ...args);
    if (this.visible) {
      this.rearrange(rect);
      return;
    }

    // remove first so we can add back on top
    browserWindow.addBrowserView(this.browserView);
    this.visible = true;
    this.rearrange(rect);
    if (focus) {
      this.webContents.focus();
    }
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  public hide() {
    if (!this.browserWindow) return;
    if (!this.visible) return;

    this.browserWindow.removeBrowserView(this.browserView);

    this.visible = false;
  }

  public destroy() {
    this.browserView.destroy();
    this.browserView = null;
  }

  protected getHeight(): Promise<number> {
    return this.webContents.executeJavaScript(`document.querySelector('.Page').offsetHeight`);
  }

  protected async adjustHeight() {
    const height = await this.getHeight();

    this.hasNewHeight = height !== this.lastHeight;
    this.lastHeight = height;
  }

  protected rearrange(rect: IRectangle = {}) {
    if (!this.visible) return;

    // put on top
    this.browserWindow.addBrowserView(this.browserView);
    const newRect = roundifyRectangle(this.calcBounds ? this.calcBounds(rect) : rect);
    const current = this.browserView.getBounds();
    if (
      current.height === newRect.height &&
      current.width === newRect.width &&
      current.x === newRect.x &&
      current.y === newRect.y
    ) {
      return;
    }

    this.browserView.setBounds(newRect as Rectangle);
  }

  private async load() {
    await this.webContents.loadURL(Application.instance.getPageUrl(this.name));
    this.webContents.on('ipc-message', (e, message) => {
      if (message === 'resize-height') {
        this.adjustHeight();
      }
    });

    // resize the BrowserView's height when the toolbar height changes
    await this.webContents.executeJavaScript(`
        const {ipcRenderer} = require('electron');
        const resizeObserver = new ResizeObserver(() => {
          ipcRenderer.send('resize-height');
        });
        const elem = document.querySelector('.Page');
        resizeObserver.observe(elem);
      `);

    if (process.env.NODE_ENV === 'development') {
      this.webContents.on('context-menu', (e, params) => {
        generateContextMenu(params, this.webContents).popup();
      });
    }
  }
}

export const roundifyRectangle = (rect: IRectangle): IRectangle => {
  const newRect: any = { ...rect };
  Object.keys(newRect).forEach(key => {
    if (!Number.isNaN(newRect[key])) newRect[key] = Math.round(newRect[key]);
  });
  return newRect;
};
