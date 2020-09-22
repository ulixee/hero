import { ipcRenderer, remote } from 'electron';
import { getTheme } from '~shared/utils/themes';
import settings from '~frontend/lib/settings';

export declare interface OverlayStore {
  onUpdateTabInfo: (tabId: number, data: any) => void;
  onHide: (data: any) => void;
}

export class OverlayStore {
  public get theme() {
    return getTheme(settings.theme);
  }

  public alwaysOnTop = false;

  public visible = false;

  public get cssVars() {
    const dialogLightForeground = this.theme.dialogLightForeground;
    return {
      '--dropdownBackgroundColor': this.theme.dropdownBackgroundColor,
      '--menuItemHoverBackgroundColor': dialogLightForeground
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.03)',
    };
  }

  private _windowId = -1;

  private readonly persistent: boolean = false;

  public constructor(
    options: {
      hideOnBlur?: boolean;
      persistent?: boolean;
    } = {},
  ) {
    const { hideOnBlur, persistent } = {
      hideOnBlur: true,
      persistent: false,
      ...options,
    };

    if (remote.getCurrentWindow()) {
      this.alwaysOnTop = remote.getCurrentWindow().isAlwaysOnTop();
    }

    if (!persistent) this.visible = true;

    this.persistent = persistent;

    if (hideOnBlur) {
      window.addEventListener('blur', () => {
        this.hide();
      });
    }

    ipcRenderer.on('update-tab-info', (e, tabId, data) => {
      this.onUpdateTabInfo(tabId, data);
    });

    this.onHide = () => {};
    this.onUpdateTabInfo = () => {};
  }

  public get webContentsId() {
    return remote.getCurrentWebContents().id;
  }

  public get windowId() {
    if (this._windowId === -1) {
      const win = remote.getCurrentWindow();
      if (win) this._windowId = win.id;
    }
    return this._windowId;
  }

  public hide(data: any = null) {
    if (this.persistent && !this.visible) return;

    this.visible = false;
    this.onHide(data);

    ipcRenderer.send('overlay:hide', this.webContentsId);
  }
}
