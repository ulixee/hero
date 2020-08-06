import { ipcRenderer, remote } from 'electron';
import { observable } from 'mobx';
import { OverlayStore } from '@/models/OverlayStore';

export class Store extends OverlayStore {
  @observable
  public alwaysOnTop = false;

  @observable
  public updateAvailable = false;

  @observable
  private pages: { id: string; url: string; isActive: boolean }[] = [];

  public constructor() {
    super();
    this.init();
    ipcRenderer.on('update-available', () => {
      this.updateAvailable = true;
    });
    ipcRenderer.on('will-show', async () => {
      this.pages = await ipcRenderer.invoke('fetch-session-pages');
    });
  }

  public async init() {
    if (remote.getCurrentWindow()) {
      this.alwaysOnTop = remote.getCurrentWindow().isAlwaysOnTop();
      this.pages = await ipcRenderer.invoke('fetch-session-pages');
    }
  }
}

export default new Store();
