import { ipcRenderer } from 'electron';
import ISettings from '~shared/interfaces/ISettings';

const settings: ISettings = ipcRenderer.sendSync('settings:fetch');

ipcRenderer.on('update-settings', (e, newSettings: ISettings) => {
  Object.assign(settings, newSettings);
});

export default settings;
