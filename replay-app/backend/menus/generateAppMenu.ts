import { app, BrowserWindow, ipcMain, Menu, MenuItem, webContents } from 'electron';
import { defaultTabOptions } from '~shared/constants/tabs';
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
        ...createMenuItem(
          ['CmdOrCtrl+T'],
          window => {
            window.createAppTab(defaultTabOptions);
          },
          'New Tab',
        ),
        {
          type: 'separator',
        },
        ...createMenuItem(
          ['CmdOrCtrl+Shift+O'],
          window => {
            ipcMain.emit('open-file');
          },
          'Open SecretAgent Script',
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
        ...createMenuItem(
          ['CmdOrCtrl+W', 'CmdOrCtrl+F4'],
          window => {
            window.sendToRenderer('remove-tab', window.selectedTabId);
          },
          'Close Tab',
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
            Window.current.selectedTab.webContents.reload();
          },
          'Reload',
        ),
        ...createMenuItem(
          ['CmdOrCtrl+Shift+R', 'Shift+F5'],
          () => {
            Window.current.selectedTab.webContents.reloadIgnoringCache();
          },
          'Reload ignoring cache',
        ),
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
              Window.current.selectedTab.webContents.toggleDevTools();
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
      label: 'Tab',
      submenu: [
        ...createMenuItem(
          isMac ? ['Cmd+Option+Right'] : ['Ctrl+Tab', 'Ctrl+PageDown'],
          () => {
            Window.current.webContents.send('select-next-tab');
          },
          'Select next tab',
        ),
        ...createMenuItem(
          isMac ? ['Cmd+Option+Left'] : ['Ctrl+Shift+Tab', 'Ctrl+PageUp'],
          () => {
            Window.current.webContents.send('select-previous-tab');
          },
          'Select previous tab',
        ),
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

  // Ctrl+1 - Ctrl+8
  template[0].submenu = template[0].submenu.concat(
    createMenuItem(
      Array.from({ length: 8 }, (v, k) => k + 1).map(i => `CmdOrCtrl+${i}`),
      (window, menuItem, i) => {
        Window.current.webContents.send('select-tab-index', i);
      },
    ),
  );

  // Ctrl+9
  template[0].submenu = template[0].submenu.concat(
    createMenuItem(['CmdOrCtrl+9'], () => {
      Window.current.webContents.send('select-last-tab');
    }),
  );

  return Menu.buildFromTemplate(template);
}

// HELPER FUNCTIONS //////

function createMenuItem(
  shortcuts: string[],
  action: (window: Window, menuItem: MenuItem, shortcutIndex: number) => void,
  label: string = null,
  enabled: boolean = true,
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
