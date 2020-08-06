import { ipcRenderer, remote } from 'electron';
import { computed, observable } from 'mobx';
import { getTheme } from '~shared/utils/themes';
import TabsStore from './app/TabsStore';
import AddTabStore from './app/AddTabStore';
import settings from '~frontend/lib/settings';

export class AppStore {
  public windowId = remote.getCurrentWindow().id;
  public addTab = new AddTabStore(this);
  public tabs = new TabsStore(this);

  @computed
  public get theme() {
    return getTheme(settings.theme);
  }

  @computed
  public get saSession() {
    return this.tabs.selectedTab?.saSession;
  }

  @computed
  public get location() {
    return this.tabs.selectedTab?.location;
  }

  @computed
  public get pageUrl() {
    return this.tabs.selectedTab?.currentUrl;
  }

  @computed
  public get ticks() {
    return this.tabs.selectedTab?.saSession.ticks;
  }

  @computed
  public get selectedTab() {
    return this.tabs.selectedTab;
  }

  @computed
  public get marks() {
    return this.tabs.selectedTab?.marks;
  }

  @computed
  public get hasSaSession() {
    if (!this.tabs.selectedTab) return false;
    return !!this.tabs.selectedTab.saSession;
  }

  @observable
  public isAlwaysOnTop = false;

  @observable
  public isFullscreen = false;

  @observable
  public isHTMLFullscreen = false;

  @observable
  public updateAvailable = false;

  @observable
  public overlayVisibility: { [key: string]: boolean } = {
    app: false,
  };

  public mouse = {
    x: 0,
    y: 0,
  };

  constructor() {
    ipcRenderer.on('fullscreen', (e, fullscreen: boolean) => {
      this.isFullscreen = fullscreen;
    });

    ipcRenderer.on('html-fullscreen', (e, fullscreen: boolean) => {
      this.isHTMLFullscreen = fullscreen;
    });

    ipcRenderer.on('update-available', () => {
      this.updateAvailable = true;
    });

    ipcRenderer.on('find', () => {
      const tab = this.tabs.selectedTab;
      if (tab) {
        ipcRenderer.send('overlay:toggle', 'find');
      }
    });

    ipcRenderer.on('overlay-visibility-change', (e, name, state) => {
      this.overlayVisibility[name] = state;
    });

    ipcRenderer.send('update-check');
  }

  public closeWindow() {
    ipcRenderer.send('window:close');
  }
}

export default new AppStore();
