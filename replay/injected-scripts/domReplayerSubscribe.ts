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

if (process.isMainFrame) {
  console.group('About Ulixee Replay');
  const osMessage =
    process.platform === 'win32'
      ? `\n\nWindows users: you can add this line to the beginning of your script 'process.env.HERO_SHOW_BROWSER="true"'.`
      : '';
  console.log(
    `This is a high fidelity %c"Replay"%c of your scraping session.

It is NOT a live Chrome view, so if you notice Javascript is not loaded or cookies/console are not working, that's just because this is not the headless Chrome running your actual script :).

To launch a real browser, use the env variable %cHERO_SHOW_BROWSER=true${osMessage}`,
    'font-weight:bold',
    'font-weight:normal',
    'background:#eee;padding:2px;',
  );
  console.groupEnd();
}

function debugLog(message: string, ...args: any[]) {
  if (window.debugToConsole) {
    console.log(...arguments);
  }
  if (!window.debugLogs) window.debugLogs = [];
  window.debugLogs.push({ message, args });
}

debugLog(
  'Loaded: isMain=%s, pid=%s, href=%s',
  window.getIsMainFrame(),
  process?.pid,
  window.location.href,
);

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
