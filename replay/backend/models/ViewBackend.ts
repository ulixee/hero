import { BrowserView } from 'electron';
import Window from './Window';
import generateContextMenu from '../menus/generateContextMenu';
import Rectangle = Electron.Rectangle;

export default abstract class ViewBackend {
  public get browserView() {
    if (!this._browserView) {
      this._browserView = new BrowserView({
        webPreferences: {
          javascript: true,
          webSecurity: true,
          sandbox: false,
          contextIsolation: false,
          ...this.webPreferences,
        },
      });
      this._browserView.setAutoResize({
        width: true,
        height: true,
        horizontal: false,
        vertical: false,
      });
      this._browserView.webContents.on('context-menu', (e, params) => {
        generateContextMenu(params, this._browserView?.webContents).popup();
      });
      this._browserView.webContents.addListener('did-start-loading', () => {
        this.window.sendToRenderer('view:updated-loading', true);
      });
      this._browserView.webContents.addListener('did-stop-loading', () => {
        this.window.sendToRenderer('view:updated-loading', false);
      });
    }
    return this._browserView;
  }

  public favicon = '';
  protected isAttached = false;
  protected readonly window: Window;
  protected readonly webPreferences: Electron.WebPreferences;
  protected bounds: Rectangle;
  protected _browserView: BrowserView;

  protected constructor(window: Window, webPreferences: Electron.WebPreferences) {
    this.window = window;
    this.webPreferences = webPreferences;
  }

  public get webContents() {
    return this.browserView.webContents;
  }

  public get title() {
    return this.webContents.getTitle();
  }

  public attach() {
    if (!this.isAttached) {
      this.window.browserWindow.addBrowserView(this.browserView);
      this.isAttached = true;
    }
  }

  public detach() {
    if (this._browserView) this.window.browserWindow.removeBrowserView(this._browserView);
    this.isAttached = false;
  }

  public destroy() {
    this.detach();
    this._browserView = null;
  }

  public fixBounds(newBounds: { x: number; width: number; y: any; height: number }) {
    this.browserView.setBounds(newBounds);
    this.bounds = newBounds;
  }
}
