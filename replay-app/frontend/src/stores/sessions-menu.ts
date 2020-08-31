import { ipcRenderer, remote } from 'electron';
import { observable } from 'mobx';
import { OverlayStore } from '~frontend/models/OverlayStore';

export class Store extends OverlayStore {
  @observable
  public alwaysOnTop = false;

  @observable
  public updateAvailable = false;

  public sessions: any[] = [];

  public constructor() {
    super();
    this.init();
    ipcRenderer.on('update-available', () => {
      this.updateAvailable = true;
    });
    ipcRenderer.on('will-show', async () => {
      this.sessions = await ipcRenderer.invoke('fetch-sessions');
    });
  }

  public async init() {
    if (remote.getCurrentWindow()) {
      this.alwaysOnTop = remote.getCurrentWindow().isAlwaysOnTop();
    }
  }
}

export default new Store();
