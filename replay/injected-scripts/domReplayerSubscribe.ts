import { ipcRenderer } from 'electron';

declare global {
  interface Window {
    replayDomChanges(...args: any[]);
    replayInteractions(...args: any[]);
    getIsMainFrame: () => boolean;
    debugLogs: any[];
    debugToConsole: boolean;
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
  ipcRenderer.on(
    'dom:apply',
    (event, columns, rawDomChanges, resultNodeIds, mouseEvent, scrollEvent) => {
      debugLog(
        'Events: changes=%s, highlighted=%s, hasMouse=%s, hasScroll=%s',
        rawDomChanges?.length ?? 0,
        resultNodeIds ? JSON.stringify(resultNodeIds) : '[]',
        !!mouseEvent,
        !!scrollEvent,
      );
      if (rawDomChanges?.length) {
        const domChanges = [];
        for (const change of rawDomChanges) {
          const record: any = {};
          for (let i = 0; i < columns.length; i += 1) {
            record[columns[i]] = change[i];
          }
          domChanges.push(record);
        }
        window.replayDomChanges(domChanges);
      }
      window.replayInteractions(resultNodeIds, mouseEvent, scrollEvent);
    },
  );
}
