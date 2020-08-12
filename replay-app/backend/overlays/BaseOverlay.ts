import { BrowserView, BrowserWindow } from 'electron';
import IRectangle from '~shared/interfaces/IRectangle';
import Rectangle = Electron.Rectangle;
import Application from '~backend/Application';

interface IOptions {
  name: string;
  devtools?: boolean;
  bounds?: IRectangle;
  calcBounds?: (bounds: IRectangle) => IRectangle;
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

  public constructor({ name, bounds, calcBounds, webPreferences, devtools }: IOptions) {
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
    this.name = name;

    this.webContents.loadURL(Application.instance.getPageUrl(this.name));
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
    options: { focus?: boolean; rect?: IRectangle },
    ...args: any[]
  ) {
    const { focus = true, rect } = options;
    this.browserWindow = browserWindow;

    this.webContents.send('will-show', ...args);
    browserWindow.webContents.send('overlay-visibility-change', this.name, true);

    if (!this.visible) {
      browserWindow.addBrowserView(this.browserView);
      this.visible = true;
    }

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

    this.browserWindow.webContents.send('overlay-visibility-change', this.name, false);

    this.browserWindow.removeBrowserView(this.browserView);

    this.visible = false;
  }

  public destroy() {
    this.browserView.destroy();
    this.browserView = null;
  }
}

export const roundifyRectangle = (rect: IRectangle): IRectangle => {
  const newRect: any = { ...rect };
  Object.keys(newRect).forEach(key => {
    if (!isNaN(newRect[key])) newRect[key] = Math.round(newRect[key]);
  });
  return newRect;
};
