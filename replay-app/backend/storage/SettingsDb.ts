import BaseDb from './BaseDb';
import ISettings from '~shared/interfaces/ISettings';

const defaultSettings = {
  theme: 'secret-agent-light',
  themeAuto: true,
};

export default class SettingsDb extends BaseDb<ISettings> {
  constructor() {
    super('Settings', { ...defaultSettings });
  }

  public fetch() {
    return { ...this.allData };
  }

  public update(newData: ISettings) {
    Object.assign(this.allData, newData);
  }
}

export { ISettings };
