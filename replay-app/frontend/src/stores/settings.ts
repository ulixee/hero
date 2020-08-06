import { remote } from 'electron';
import { computed } from 'mobx';
import { getTheme } from '~shared/utils/themes';
import settings from '@/lib/settings';

export class SettingsStore {
  public windowId = remote.getCurrentWindow().id;

  @computed
  public get theme() {
    return getTheme(settings.theme);
  }

  @computed
  public get settings() {
    return settings;
  }
}

export default new SettingsStore();
