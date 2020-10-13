import Window from './Window';
import ViewBackend from './ViewBackend';
import IWindowLocation, { InternalLocations } from '~shared/interfaces/IWindowLocation';
import Application from '~backend/Application';

export default class AppView extends ViewBackend {
  public location: InternalLocations;

  public constructor(window: Window) {
    super(window, {
      nodeIntegration: true,
      enableRemoteModule: true,
    });
  }

  public async load(location: IWindowLocation = InternalLocations.Dashboard) {
    if (this.browserView.isDestroyed()) return;
    this.attach();
    this.location = InternalLocations[location];

    const page = location.toLowerCase();

    const url = Application.instance.getPageUrl(page);
    console.log('Loading app page', url);

    await this.webContents.loadURL(url);
    this.webContents.focus();
  }
}
