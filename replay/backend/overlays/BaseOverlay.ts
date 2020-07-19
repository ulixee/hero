import { BrowserView, BrowserWindow } from 'electron';
import IRectangle from '~shared/interfaces/IRectangle';
import Rectangle = Electron.Rectangle;

interface IOptions {
  name: string;
  devtools?: boolean;
  bounds?: IRectangle;
  calcBounds?: (bounds: IRectangle) => IRectangle;
  hideTimeout?: number;
  customHide?: boolean;
  webPreferences?: Electron.WebPreferences;
  onWindowBoundsUpdate?: () => void;
}

export default class BaseOverlay {
  public name: string;
  public browserWindow: BrowserWindow;
  public browserView: BrowserView;
  public visible = false;
  public bounds: IRectangle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  private readonly calcBounds: (bounds: IRectangle) => IRectangle;
  private timeout: any;
  private hideTimeout: number;

  private isLoaded = false;
  private isInitialized = false;
  private showCallback: any = null;

  public constructor({
    name,
    bounds,
    calcBounds,
    hideTimeout,
    webPreferences,
    devtools,
  }: IOptions) {
    this.browserView = new BrowserView({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        ...webPreferences,
      },
    });

    this.bounds = { ...this.bounds, ...(bounds || {}) };
    this.calcBounds = calcBounds;
    this.hideTimeout = hideTimeout;
    this.name = name;

    const { webContents } = this.browserView;

    webContents.once('dom-ready', () => {
      this.isLoaded = true;
      if (this.showCallback) {
        this.showCallback();
        this.showCallback = null;
      }
    });

    if (devtools) {
      this.webContents.openDevTools({ mode: 'detach' });
    }
  }

  public get webContents() {
    return this.browserView.webContents;
  }

  public get id() {
    return this.webContents.id;
  }

  public rearrange(rect: IRectangle = {}) {
    let newRect: IRectangle = {
      height: rect.height || this.bounds.height || 0,
      width: rect.width || this.bounds.width || 0,
      x: rect.x || this.bounds.x || 0,
      y: rect.y || this.bounds.y || 0,
      right: rect.right,
      left: rect.left,
    };
    newRect = roundifyRectangle(this.calcBounds ? this.calcBounds(newRect) : newRect);

    if (this.visible) {
      this.browserView.setBounds(newRect as Rectangle);
    }
  }

  public show(
    browserWindow: BrowserWindow,
    options: { focus?: boolean; waitForLoad?: boolean; rect?: IRectangle },
    ...args: any[]
  ) {
    if (!this.isInitialized) {
      this.initialize();
    }
    const { focus = true, waitForLoad = true, rect } = options;
    return new Promise(resolve => {
      this.browserWindow = browserWindow;

      clearTimeout(this.timeout);

      this.webContents.send('will-show', ...args);
      browserWindow.webContents.send('overlay-visibility-change', this.name, true);

      const callback = () => {
        if (this.visible) {
          this.rearrange(rect);
          if (focus) {
            this.webContents.focus();
          }
          return;
        }

        this.visible = true;

        browserWindow.addBrowserView(this.browserView);
        this.rearrange(rect);
        if (focus) {
          this.webContents.focus();
        }

        resolve();
      };

      if (!this.isLoaded && waitForLoad) {
        this.showCallback = callback;
        return;
      }

      callback();
    });
  }

  public send(channel: string, ...args: any[]) {
    this.webContents.send(channel, ...args);
  }

  public hide() {
    if (!this.browserWindow) return;
    if (!this.visible) return;

    this.browserWindow.webContents.send('overlay-visibility-change', this.name, false);
    clearTimeout(this.timeout);

    if (this.hideTimeout) {
      this.timeout = setTimeout(() => {
        this.browserWindow.removeBrowserView(this.browserView);
      }, this.hideTimeout);
    } else {
      this.browserWindow.removeBrowserView(this.browserView);
    }

    this.visible = false;
  }

  public destroy() {
    this.browserView.destroy();
    this.browserView = null;
  }

  private initialize() {
    this.isInitialized = true;
    this.webContents.loadURL(`http://localhost:3000/${this.name}`);
  }
}

export const roundifyRectangle = (rect: IRectangle): IRectangle => {
  const newRect: any = { ...rect };
  Object.keys(newRect).forEach(key => {
    if (!isNaN(newRect[key])) newRect[key] = Math.round(newRect[key]);
  });
  return newRect;
};
