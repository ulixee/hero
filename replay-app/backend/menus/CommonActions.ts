import { extname } from 'path';
import { dialog } from 'electron';
import Application from '../Application';

export const saveAs = async () => {
  const { title, webContents } = Application.instance.windowManager.current.tabManager.selected;

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
  const { tabManager } = Application.instance.windowManager.current;
  // tabManager.createTab({ url: `view-source:${tabManager.selected.url}`, active: true }, true);
};

export const printPage = () => {
  const { webContents } = Application.instance.windowManager.current.tabManager.selected;
  webContents.print();
};
