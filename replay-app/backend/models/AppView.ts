import Window from './Window';
import TabBackend from './TabBackend';
import ITabLocation, { InternalLocations } from '~shared/interfaces/ITabLocation';
import InternalServer from '~shared/constants/files';

export default class AppView extends TabBackend {
  public location: InternalLocations;

  public constructor(window: Window, location: ITabLocation, replaceTabId?: number) {
    super(window, {});
    this.loadLocation(location, true, replaceTabId);
  }

  public loadLocation(location: ITabLocation, isNewTab = false, replaceTabId?: number) {
    if (this.browserView.isDestroyed()) return;
    if (!isNewTab && !this.isActiveTab) return;
    if (location === this.location) return;

    this.location = InternalLocations[location];

    const page = location === InternalLocations.NewTab ? 'home' : location.toLowerCase();

    console.log('Loading app page', `${InternalServer.url}/${page}`);

    this.webContents.loadURL(`${InternalServer.url}/${page}`);

    this.window.sendToRenderer('tab:updated', { id: this.id, location, replaceTabId });
  }
}
