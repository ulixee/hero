import { BrowserView } from 'electron';
import Window from './Window';
import generateContextMenu from '../menus/generateContextMenu';
import Rectangle = Electron.Rectangle;

export default abstract class TabBackend {
  public browserView: BrowserView;

  public favicon = '';
  protected readonly window: Window;
  private bounds: Rectangle;

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

    (this.webContents as any).windowId = window.browserWindow.id;
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

  public get id() {
    return this.webContents.id;
  }

  public get isActiveTab() {
    return this.id === this.window.selectedTabId;
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

  private bindListeners() {
    this.webContents.on('context-menu', (e, params) => {
      generateContextMenu(this.window, params, this.webContents).popup();
    });

    this.webContents.addListener('did-start-loading', () => {
      this.window.sendToRenderer('tab:updated-loading', this.id, true);
    });

    this.webContents.addListener('did-stop-loading', () => {
      this.window.sendToRenderer('tab:updated-loading', this.id, false);
    });
  }
}
