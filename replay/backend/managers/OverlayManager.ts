import { BrowserWindow } from 'electron';
import BaseOverlay from '../overlays/BaseOverlay';
import FindOverlay from '../overlays/FindOverlay';
import MainMenu from '../overlays/MainMenu';
import LocationsMenu from '../overlays/LocationsMenu';
import ScriptInstancesMenu from '../overlays/ScriptInstancesMenu';
import SessionsMenu from '../overlays/SessionsMenu';
import SessionUrlsMenu from '../overlays/SessionUrlsMenu';
import IRectangle from '~shared/interfaces/IRectangle';
import CommandOverlay from '../overlays/CommandOverlay';

export default class OverlayManager {
  private overlays: BaseOverlay[] = [];

  public start() {
    this.overlays.push(new FindOverlay());
    this.overlays.push(new MainMenu());
    this.overlays.push(new LocationsMenu());
    this.overlays.push(new ScriptInstancesMenu());
    this.overlays.push(new SessionsMenu());
    this.overlays.push(new SessionUrlsMenu());
    this.overlays.push(new CommandOverlay());
  }

  public show(name: string, browserWindow: BrowserWindow, rect: IRectangle, ...args: any[]) {
    this.getByName(name).show(browserWindow, { rect }, ...args);
  }

  public toggle(name: string, browserWindow: BrowserWindow, rect: IRectangle) {
    const overlay = this.getByName(name);
    if (overlay.visible) {
      overlay.hide();
    } else {
      overlay.show(browserWindow, { rect });
    }
  }

  public get browserViews() {
    return Array.from(this.overlays).map(x => x.browserView);
  }

  public destroy = () => {
    this.browserViews.forEach(x => x.destroy());
  };

  public sendToAll = (channel: string, ...args: any[]) => {
    this.browserViews.forEach(x => !x.isDestroyed() && x.webContents.send(channel, ...args));
  };

  public getByName(name: string) {
    return this.overlays.find(x => x.name === name);
  }

  public getByWebContentsId(webContentsId: number) {
    return this.overlays.find(x => x.id === webContentsId);
  }

  public isVisible(name: string) {
    return this.getByName(name).visible;
  }
}
