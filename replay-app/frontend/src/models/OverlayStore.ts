import { ipcRenderer, remote } from 'electron';
import { getTheme } from '~shared/utils/themes';
import settings from '~frontend/lib/settings';

export class OverlayStore {
  public get theme() {
    return getTheme(settings.theme);
  }

  public get cssVars() {
    const dialogLightForeground = this.theme.dialogLightForeground;
    return {
      '--dropdownBackgroundColor': this.theme.dropdownBackgroundColor,
      '--menuItemHoverBackgroundColor': dialogLightForeground
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.03)',
    };
  }

  public constructor(hideOnBlur = true) {
    if (hideOnBlur) {
      window.addEventListener('blur', () => {
        this.hide();
      });
    }
  }

  public get webContentsId() {
    return remote.getCurrentWebContents().id;
  }

  public hide() {
    ipcRenderer.send('overlay:hide', this.webContentsId);
  }
}
