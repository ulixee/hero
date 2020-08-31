import { ipcRenderer, remote } from 'electron';

(window as any).electron = { ipcRenderer, remote };
