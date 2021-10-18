// NOTE: do not use node dependencies

import { IFrontendDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';

declare global {
  interface Window {
    loadPaintEvents(paintEvents: IFrontendDomChangeEvent[][]);
    applyDomChanges(changes: IFrontendDomChangeEvent[]);
    setPaintIndexRange(startIndex: number, endIndex: number);
    repositionInteractElements();
    debugLogs: any[];
    isMainFrame: boolean;
    debugToConsole: boolean;
    waitForFramesReady?: boolean;
    selfFrameIdPath: string;
  }
  function debugLog(message: string, ...args: any[]): void;
}

class DomReplayer {
  private paintEvents: IFrontendDomChangeEvent[][] = [];
  private loadedIndex = -1;

  private pendingDelegatedEventsByChildNodeId: { [nodeId: number]: IFrontendDomChangeEvent[] } = {};
  private pendingDomChanges: IFrontendDomChangeEvent[] = [];
  private frameContentWindows = new WeakMap<Window, { isReady: boolean; frameNodeId: number }>();

  constructor() {
    if (window.waitForFramesReady) {
      window.DomActions.onFrameModifiedCallbacks.push((element, change) => {
        if (element.contentWindow && change.nodeId) {
          this.frameContentWindows.set(element.contentWindow, {
            frameNodeId: change.nodeId,
            isReady: false,
          });
        }
      });
    }
  }

  public loadPaintEvents(newPaintEvents: IFrontendDomChangeEvent[][]): void {
    this.paintEvents = newPaintEvents;
    this.loadedIndex = -1;
    debugLog('Loaded PaintEvents', newPaintEvents);
  }

  public setPaintIndexRange(startIndex: number, endIndex: number): void {
    if (endIndex === this.loadedIndex) return;
    debugLog('Setting paint index range', startIndex, endIndex, document.readyState);

    for (let i = startIndex; i <= endIndex; i += 1) {
      this.applyDomChanges(this.paintEvents[i]);
    }

    this.loadedIndex = endIndex;
  }

  private applyDomChanges(changeEvents: IFrontendDomChangeEvent[]): void {
    this.pendingDomChanges.push(...changeEvents);
    if (document.readyState !== 'complete') {
      document.addEventListener('DOMContentLoaded', () => this.applyDomChanges([]), { once: true });
      return;
    }

    if (window.isMainFrame && !window.selfFrameIdPath) {
      window.selfFrameIdPath = 'main';
    }

    for (const changeEvent of this.pendingDomChanges) {
      try {
        const frameIdPath = changeEvent.frameIdPath;
        if (frameIdPath && window.selfFrameIdPath !== frameIdPath) {
          this.delegateToChildFrame(changeEvent);
        } else {
          window.DomActions.replayDomEvent(changeEvent);
        }
      } catch (err) {
        debugLog('ERROR applying change', changeEvent, err);
      }
    }
    this.pendingDomChanges.length = 0;
  }

  private delegateToChildFrame(event: IFrontendDomChangeEvent) {
    const nodeId = event.frameIdPath
      .replace(window.selfFrameIdPath, '') // replace current path
      .split('_') // get nodeIds
      .filter(Boolean)
      .shift();

    const frameNodeId = Number(nodeId);

    // queue for pending events
    this.pendingDelegatedEventsByChildNodeId[frameNodeId] ??= [];
    this.pendingDelegatedEventsByChildNodeId[frameNodeId].push(event);

    this.sendPendingEvents(frameNodeId);
  }

  private sendPendingEvents(frameNodeId: number): void {
    const node = window.getNodeById(frameNodeId);
    if (!node) return;

    const frame = node as HTMLIFrameElement;
    if (!frame.contentWindow) {
      debugLog('Frame: without window', frame);
      return;
    }

    if (window.waitForFramesReady && !this.frameContentWindows.get(frame.contentWindow)?.isReady) {
      return;
    }

    const events = this.pendingDelegatedEventsByChildNodeId[frameNodeId];
    if (!events) return;

    this.pendingDelegatedEventsByChildNodeId[frameNodeId] = [];

    frame.contentWindow.postMessage(
      { recipientFrameIdPath: `${window.selfFrameIdPath}_${frameNodeId}`, events, action: 'dom' },
      '*',
    );
  }

  private setChildFrameIsReady(frameWindow: Window): void {
    if (!this.frameContentWindows.has(frameWindow)) {
      debugLog('WARN: child frame activated without frameid');
      return;
    }
    const entry = this.frameContentWindows.get(frameWindow);
    entry.isReady = true;

    this.sendPendingEvents(entry.frameNodeId);
  }

  static register(): void {
    if (window.waitForFramesReady !== true || window.isMainFrame || window.parent === window.self) {
      return;
    }
    window.parent.postMessage({ action: 'ready' }, '*');
  }

  static load() {
    const replayer = new DomReplayer();
    (window as any).domReplayer = replayer;
    window.loadPaintEvents = replayer.loadPaintEvents.bind(replayer);
    window.setPaintIndexRange = replayer.setPaintIndexRange.bind(replayer);
    window.applyDomChanges = replayer.applyDomChanges.bind(replayer);

    window.addEventListener('message', ev => {
      if (ev.data.action === 'ready') {
        replayer.setChildFrameIsReady(ev.source as Window);
        return;
      }
      if (ev.data.recipientFrameIdPath && !window.selfFrameIdPath) {
        window.selfFrameIdPath = ev.data.recipientFrameIdPath;
      }
      if (ev.data.action === 'dom') {
        replayer.applyDomChanges(ev.data.events);
      }
    });

    if (document.readyState === 'complete') {
      DomReplayer.register();
    } else {
      window.addEventListener('DOMContentLoaded', () => DomReplayer.register());
    }
  }
}

window.isMainFrame = false;

DomReplayer.load();

function debugLog(message: string, ...args: any[]) {
  if (window.debugToConsole) {
    // eslint-disable-next-line prefer-rest-params,no-console
    console.log(...arguments);
  }
  window.debugLogs ??= [];
  window.debugLogs.push({ message, args });
}
