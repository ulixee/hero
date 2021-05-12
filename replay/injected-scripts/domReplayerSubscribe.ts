import { ipcRenderer } from 'electron';

declare global {
  interface Window {
    replayDomChanges(...args: any[]);
    replayInteractions(...args: any[]);
    getIsMainFrame: () => boolean;
    idMap: Map<number, Node>;
    debugLogs: any[];
    debugToConsole: boolean;
    getNodeById(id: number): Node;
  }
}

window.getIsMainFrame = function () {
  return process.isMainFrame;
};
window.debugToConsole = false;

console.log(
  'Loaded: isMain=%s, pid=%s, href=%s',
  window.getIsMainFrame(),
  process?.pid,
  window.location.href,
);

function debugLog(message: string, ...args: any[]) {
  if (window.debugToConsole) {
    console.log(...arguments);
  }
  if (!window.debugLogs) window.debugLogs = [];
  window.debugLogs.push({ message, args });
}

if (process.isMainFrame) {
  ipcRenderer.on('dom:apply', (event, domChanges, resultNodeIds, mouseEvent, scrollEvent) => {
    debugLog(
      'Events: changes=%s, highlighted=%s, hasMouse=%s, hasScroll=%s',
      domChanges?.length ?? 0,
      resultNodeIds?.length ?? 0,
      !!mouseEvent,
      !!scrollEvent,
    );
    window.replayDomChanges(domChanges);
    window.replayInteractions(resultNodeIds, mouseEvent, scrollEvent);
  });
}
