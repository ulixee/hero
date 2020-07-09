import { ipcRenderer, remote } from 'electron';
import { observable, computed } from 'mobx';
import { getTheme } from '~shared/utils/themes';
import ISettings from '~shared/interfaces/ISettings';

// tslint:disable-next-line:interface-name
export declare interface OverlayStore {
  onUpdateTabInfo: (tabId: number, data: any) => void;
  onHide: (data: any) => void;
}

export class OverlayStore {
  @observable
  public settings: ISettings = ipcRenderer.sendSync('settings:fetch');

  @computed
  public get theme() {
    return getTheme(this.settings.theme);
  }

  @observable
  public visible = false;

  protected args: any;
  protected onShowArgs?: (...args: any[]) => void;

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

    if (!persistent) this.visible = true;

    this.persistent = persistent;

    if (hideOnBlur) {
      window.addEventListener('blur', () => {
        this.hide();
      });
    }

    ipcRenderer.on('show-args', (event, ...args: any[]) => {
      this.args = args;
      if (this.onShowArgs) this.onShowArgs(...args);
    });

    ipcRenderer.on('update-settings', (e, settings: ISettings) => {
      this.settings = { ...this.settings, ...settings };
    });

    ipcRenderer.on('update-tab-info', (e, tabId, data) => {
      this.onUpdateTabInfo(tabId, data);
    });

    this.onHide = () => {}; // tslint:disable-line:no-empty
    this.onUpdateTabInfo = () => {}; // tslint:disable-line:no-empty
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
