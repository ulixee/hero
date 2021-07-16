import { app, BrowserWindow, ipcMain, Menu, MenuItem, webContents, shell } from 'electron';
import * as Path from 'path';
import * as Os from 'os';
import { saveAs, viewSource } from './CommonActions';
import Window from '../models/Window';

const isMac = process.platform === 'darwin';

export default function generateAppMenu() {
  const template: any = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideothers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        ...createMenuItem(
          ['CmdOrCtrl+N'],
          () => {
            Window.create();
          },
          'New Window',
        ),
        {
          type: 'separator',
        },
        ...createMenuItem(
          ['CmdOrCtrl+Shift+O'],
          () => {
            ipcMain.emit('open-file');
          },
          'Open Hero Script',
        ),
        {
          type: 'separator',
        },
        ...createMenuItem(
          ['CmdOrCtrl+Shift+W'],
          window => {
            window.browserWindow.close();
          },
          'Close Window',
        ),
        {
          type: 'separator',
        },
        ...createMenuItem(
          ['CmdOrCtrl+S'],
          () => {
            saveAs();
          },
          'Save Webpage As...',
        ),
        // {
        //   type: 'separator',
        // },
        // ...createMenuItem(
        //   ['CmdOrCtrl+P'],
        //   () => {
        //     printPage();
        //   },
        //   'Print',
        // ),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
        // { type: 'separator' },
        // ...createMenuItem(
        //   ['CmdOrCtrl+F'],
        //   () => {
        //     Window.current.sendToRenderer('find');
        //   },
        //   'Find in page',
        // ),
      ],
    },
    {
      label: 'View',
      submenu: [
        ...createMenuItem(
          ['CmdOrCtrl+R', 'F5'],
          () => {
            Window.current.activeView.webContents.reload();
          },
          'Reload',
        ),
        ...createMenuItem(
          ['CmdOrCtrl+Shift+R', 'Shift+F5'],
          () => {
            Window.current.activeView.webContents.reloadIgnoringCache();
          },
          'Reload ignoring cache',
        ),
      ],
    },
    {
      label: 'Replay',
      submenu: [
        {
          label: 'View History',
          click: () => {
            return Window.current.openAppLocation('History');
          },
        },
        {
          label: 'Reveal in Sessions Directory',
          click: () => {
            const dir = Path.join(
              Window.current.replayApi?.heroSession?.dataLocation ??
                Path.join(Os.tmpdir(), '.ulixee'),
            );
            if (Window.current.replayApi?.heroSession) {
              return shell.showItemInFolder(
                `${Path.join(dir, Window.current.replayApi?.heroSession.id)}.db`,
              );
            }
            return shell.openPath(dir);
          },
        },
        ...createMenuItem(['Left'], () => {
          if (!Window.current) return;
          return Window.current.replayView?.gotoPreviousTick();
        }),
        ...createMenuItem(['Right'], () => {
          if (!Window.current) return;
          return Window.current.replayView?.gotoNextTick();
        }),
      ],
    },
    {
      label: 'Tools',
      submenu: [
        ...createMenuItem(
          ['CmdOrCtrl+U'],
          () => {
            viewSource();
          },
          'View Source',
          false,
        ),
        ...createMenuItem(
          ['CmdOrCtrl+Shift+I', 'CmdOrCtrl+Shift+J', 'F12'],
          () => {
            setTimeout(() => {
              Window.current.activeView.webContents.toggleDevTools();
            }, 0);
          },
          'Developer Tools',
        ),

        // Developer tools (current webContents) (dev)
        ...createMenuItem(['CmdOrCtrl+Shift+F12'], () => {
          setTimeout(() => {
            webContents.getFocusedWebContents().openDevTools({ mode: 'detach' });
          }, 0);
        }),
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }, { type: 'separator' }, { role: 'window' }]
          : [{ role: 'close', accelerator: '' }]),
        { type: 'separator' },
        {
          label: 'Always on top',
          type: 'checkbox',
          checked: false,
          click(menuItem: MenuItem, browserWindow: BrowserWindow) {
            browserWindow.setAlwaysOnTop(!browserWindow.isAlwaysOnTop());
            menuItem.checked = browserWindow.isAlwaysOnTop();
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

// HELPER FUNCTIONS //////

function createMenuItem(
  shortcuts: string[],
  action: (window: Window, menuItem: MenuItem, shortcutIndex: number) => void,
  label: string = null,
  enabled = true,
) {
  const result: any = shortcuts.map((shortcut, key) => ({
    accelerator: shortcut,
    visible: label != null && key === 0,
    label: label != null && key === 0 ? label : '',
    enabled,
    click: (menuItem: MenuItem, browserWindow: BrowserWindow) =>
      action(
        Window.list.find(x => x.browserWindow?.id === browserWindow?.id),
        menuItem,
        key,
      ),
  }));

  return result;
}
