import { ipcRenderer, remote } from "electron";
import { computed, observable } from "mobx";
import { getTheme } from "~shared/utils/themes";
import ISettings from "~shared/interfaces/ISettings";

export class BaseStore {
  @observable
  public settings: ISettings = ipcRenderer.sendSync('settings:fetch');

  public constructor() {
    ipcRenderer.on('update-settings', (e, settings: ISettings) => {
      this.settings = { ...this.settings, ...settings };
    });
  }

  @computed
  public get windowId() {
    const window = remote.getCurrentWindow();
    return window ? window.id : null;
  }

  @computed
  public get theme() {
    return getTheme(this.settings.theme);
  }
}

export default new BaseStore();
