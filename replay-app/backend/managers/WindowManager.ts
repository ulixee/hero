import { BrowserWindow } from 'electron';
import Window from '../models/Window';
import ReplayApi from '~backend/ReplayApi';

export default class WindowManager {
  public list: Window[] = [];
  public current: Window;
  public lastFocused: Window;

  public createWindow(replayApi?: ReplayApi) {
    const window = new Window(replayApi);
    this.list.push(window);

    window.browserWindow.on('focus', () => {
      this.lastFocused = window;
    });
  }

  public findByBrowserView(webContentsId: number) {
    return this.list.find(x => !!x.tabManager.byId.get(webContentsId));
  }

  public fromBrowserWindow(browserWindow: BrowserWindow): Window {
    return this.list.find(x => x.id === browserWindow.id);
  }

  public broadcast(channel: string, ...args: unknown[]) {
    this.list.forEach(window => window.browserWindow.webContents.send(channel, ...args));
  }
}
