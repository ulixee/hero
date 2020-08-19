import { ipcRenderer } from 'electron';
import './domReplayer';

ipcRenderer.on('dom:apply', (event, ...args) => {
  // @ts-ignore
  window.replayEvents(...args);
});
