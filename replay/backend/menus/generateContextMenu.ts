import { clipboard, Menu, nativeImage } from 'electron';
import { printPage, saveAs, viewSource } from './CommonActions';
import Window from '../models/Window';

export default function generateContextMenu(
  params: Electron.ContextMenuParams,
  webContents: Electron.WebContents,
) {
  let menuItems: Electron.MenuItemConstructorOptions[] = [];

  if (params.linkURL !== '') {
    menuItems = menuItems.concat([
      {
        label: 'Copy link address',
        click: () => {
          clipboard.clear();
          clipboard.writeText(params.linkURL);
        },
      },
      {
        type: 'separator',
      },
    ]);
  }

  if (params.hasImageContents) {
    menuItems = menuItems.concat([
      {
        label: 'Copy image',
        click: () => {
          const img = nativeImage.createFromDataURL(params.srcURL);

          clipboard.clear();
          clipboard.writeImage(img);
        },
      },
      {
        label: 'Copy image address',
        click: () => {
          clipboard.clear();
          clipboard.writeText(params.srcURL);
        },
      },
      {
        type: 'separator',
      },
    ]);
  }

  if (params.isEditable) {
    menuItems = menuItems.concat([
      {
        role: 'undo',
        accelerator: 'CmdOrCtrl+Z',
      },
      {
        role: 'redo',
        accelerator: 'CmdOrCtrl+Shift+Z',
      },
      {
        type: 'separator',
      },
      {
        role: 'cut',
        accelerator: 'CmdOrCtrl+X',
      },
      {
        role: 'copy',
        accelerator: 'CmdOrCtrl+C',
      },
      {
        role: 'pasteAndMatchStyle',
        accelerator: 'CmdOrCtrl+V',
        label: 'Paste',
      },
      {
        role: 'paste',
        accelerator: 'CmdOrCtrl+Shift+V',
        label: 'Paste as plain text',
      },
      {
        role: 'selectAll',
        accelerator: 'CmdOrCtrl+A',
      },
      {
        type: 'separator',
      },
    ]);
  }

  if (!params.isEditable && params.selectionText !== '') {
    menuItems = menuItems.concat([
      {
        role: 'copy',
        accelerator: 'CmdOrCtrl+C',
      },
      {
        type: 'separator',
      },
    ]);
  }

  if (
    !params.hasImageContents &&
    params.linkURL === '' &&
    params.selectionText === '' &&
    !params.isEditable
  ) {
    menuItems = menuItems.concat([
      {
        label: 'Go back',
        accelerator: 'Alt+Left',
        enabled: Window.current.hasBack(),
        click: () => {
          return Window.current.goBack();
        },
      },
      {
        label: 'Go forward',
        accelerator: 'Alt+Right',
        enabled: Window.current.hasNext(),
        click: () => {
          return Window.current.goForward();
        },
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          webContents.reload();
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Save as...',
        accelerator: 'CmdOrCtrl+S',
        click: async () => {
          saveAs();
        },
      },
      {
        label: 'Print',
        accelerator: 'CmdOrCtrl+P',
        click: async () => {
          printPage();
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'View page source',
        accelerator: 'CmdOrCtrl+U',
        click: () => {
          viewSource();
        },
        enabled: false,
      },
    ]);
  }

  menuItems.push({
    label: 'Inspect',
    accelerator: 'CmdOrCtrl+Shift+I',
    click: () => {
      webContents.inspectElement(params.x, params.y);

      if (webContents.isDevToolsOpened()) {
        webContents.devToolsWebContents.focus();
      } else {
        webContents.openDevTools({ mode: 'detach' });
      }
    },
  });

  return Menu.buildFromTemplate(menuItems);
}
