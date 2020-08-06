import { ipcRenderer, remote } from 'electron';
import { observable } from 'mobx';
import { OverlayStore } from '@/models/OverlayStore';

export class Store extends OverlayStore {
  @observable
  public alwaysOnTop = false;

  @observable
  public updateAvailable = false;

  public constructor() {
    super();
    this.init();
    ipcRenderer.on('update-available', () => {
      this.updateAvailable = true;
    });
  }

  public async init() {
    if (remote.getCurrentWindow()) {
      this.alwaysOnTop = remote.getCurrentWindow().isAlwaysOnTop();
    }
  }
}

export default new Store();
