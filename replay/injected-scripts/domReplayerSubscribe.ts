import { ipcRenderer } from 'electron';
import './domReplayer';

declare namespace window {
  function replayEvents(...args: any[]);
}

ipcRenderer.on('dom:apply', (event, ...args) => {
  requestAnimationFrame(() => window.replayEvents(...args));
});
