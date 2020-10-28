import { ipcRenderer } from 'electron';
import './domReplayer';

declare global {
  interface Window {
    replayEvents(...args: any[]);
    isMainFrame: boolean;
  }
}

window.isMainFrame = process.isMainFrame;

console.log('Loaded: isMain=%s, pid=%s., href=%s', window.isMainFrame, process?.pid, window.location.href);

if (process.isMainFrame) {
  ipcRenderer.on('dom:apply', (event, ...args) => {
    window.replayEvents(...args);
  });
}
