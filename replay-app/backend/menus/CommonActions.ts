import { extname } from 'path';
import { dialog } from 'electron';
import Window from '../models/Window';

export const saveAs = async () => {
  const { title, webContents } = Window.current.selectedTab;

  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: title,
    filters: [
      { name: 'Webpage, Complete', extensions: ['html', 'htm'] },
      { name: 'Webpage, HTML Only', extensions: ['htm', 'html'] },
    ],
  });

  if (canceled) return;

  const ext = extname(filePath);

  webContents.savePage(filePath, ext === '.htm' ? 'HTMLOnly' : 'HTMLComplete');
};

export const viewSource = async () => {
  // const window = Window.current;
  // tabManager.createTab({ url: `view-source:${tabManager.selected.url}`, active: true }, true);
};

export const printPage = () => {
  const { webContents } = Window.current.selectedTab;
  webContents.print();
};
