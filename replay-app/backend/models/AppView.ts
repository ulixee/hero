import Window from './Window';
import TabBackend from './TabBackend';
import ITabLocation, { InternalLocations } from '~shared/interfaces/ITabLocation';
import Application from '~backend/Application';

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

    const url = Application.instance.getPageUrl(page);
    console.log('Loading app page', url);

    this.webContents.loadURL(url);

    this.window.sendToRenderer('tab:updated', { id: this.id, location, replaceTabId });
  }
}
