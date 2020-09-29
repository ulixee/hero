import { BrowserView } from 'electron';
import Window from './Window';
import generateContextMenu from '../menus/generateContextMenu';
import Rectangle = Electron.Rectangle;

export default abstract class ViewBackend {
  public browserView: BrowserView;

  public favicon = '';
  protected isAttached = false;
  protected readonly window: Window;
  protected bounds: Rectangle;

  protected constructor(window: Window, webPreferences: Electron.WebPreferences) {
    this.window = window;
    this.browserView = new BrowserView({
      webPreferences: {
        javascript: true,
        webSecurity: true,
        sandbox: false,
        ...webPreferences,
      },
    });
    this.browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false,
    });

    this.bindListeners();
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
    if (!this.isAttached || !this.browserView) return;
    this.window.browserWindow.removeBrowserView(this.browserView);
    this.isAttached = false;
  }

  public destroy() {
    this.detach();
    this.browserView?.destroy();
    this.browserView = null;
  }

  public fixBounds(newBounds: { x: number; width: number; y: any; height: number }) {
    this.browserView.setBounds(newBounds);
    this.bounds = newBounds;
  }

  private bindListeners() {
    this.webContents.on('context-menu', (e, params) => {
      generateContextMenu(params, this.webContents).popup();
    });

    this.webContents.addListener('did-start-loading', () => {
      this.window.sendToRenderer('view:updated-loading', true);
    });

    this.webContents.addListener('did-stop-loading', () => {
      this.window.sendToRenderer('view:updated-loading', false);
    });
  }
}
