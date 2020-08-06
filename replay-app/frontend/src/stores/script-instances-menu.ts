import { ipcRenderer, remote } from 'electron';
import { observable } from 'mobx';
import { OverlayStore } from '@/models/OverlayStore';

export class Store extends OverlayStore {
  @observable
  public alwaysOnTop = false;

  @observable
  public updateAvailable = false;

  @observable
  private instances: {
    startDate: string;
    scriptInstanceId: string;
    dataLocation: string;
    sessionName: string;
    isActive: boolean;
  }[] = [];

  public constructor() {
    super();
    this.init();
    ipcRenderer.on('update-available', () => {
      this.updateAvailable = true;
    });
    ipcRenderer.on('will-show', async () => {
      this.instances = await ipcRenderer.invoke('fetch-script-instances');
    });
  }

  public async init() {
    if (remote.getCurrentWindow()) {
      this.alwaysOnTop = remote.getCurrentWindow().isAlwaysOnTop();
      this.instances = await ipcRenderer.invoke('fetch-script-instances');
    }
  }
}

export default new Store();
