"use strict";
// NOTE: do not use node dependencies
Object.defineProperty(exports, "__esModule", { value: true });
class DomReplayer {
    constructor() {
        this.paintEvents = [];
        this.loadedIndex = -1;
        this.pendingDelegatedEventsByChildNodeId = {};
        this.pendingDomChanges = [];
        this.frameContentWindows = new WeakMap();
        if (window.waitForFramesReady) {
            window.DomActions.onFrameModifiedCallbacks.push((element, change) => {
                if (element.contentWindow && change.nodeId && element.isConnected) {
                    this.frameContentWindows.set(element.contentWindow, {
                        frameNodeId: change.nodeId,
                        isReady: false,
                    });
                }
            });
        }
    }
    reset() {
        this.paintEvents.length = 0;
        this.loadedIndex = 0;
        this.pendingDelegatedEventsByChildNodeId = {};
        this.pendingDomChanges = [];
        this.frameContentWindows = new WeakMap();
        // eslint-disable-next-line no-restricted-globals
        location.href = 'about:blank';
    }
    loadPaintEvents(newPaintEvents) {
        this.pendingDomChanges.length = 0;
        for (let i = 0; i < newPaintEvents.length; i += 1) {
            const paint = newPaintEvents[i] || [];
            if (!this.paintEvents[i] || paint.length !== this.paintEvents[i].length) {
                this.paintEvents[i] = paint;
            }
        }
        debugLog('Loaded PaintEvents', newPaintEvents);
    }
    setPaintIndex(index) {
        if (index === this.loadedIndex)
            return;
        debugLog('Setting paint index', {
            newIndex: index,
            currentIndex: this.loadedIndex,
            readyState: document.readyState,
        });
        if (this.loadedIndex > index) {
            this.pendingDomChanges.length = 0;
            // go backwards
            for (let i = this.loadedIndex; i > index; i -= 1) {
                if (!this.paintEvents[i])
                    continue;
                const paints = [...this.paintEvents[i]].reverse();
                this.applyDomChanges(paints, true);
            }
        }
        else {
            for (let i = this.loadedIndex + 1; i <= index; i += 1) {
                if (!this.paintEvents[i])
                    continue;
                this.applyDomChanges(this.paintEvents[i]);
            }
        }
        this.loadedIndex = index;
        if (window.repositionInteractElements)
            window.repositionInteractElements();
        if (!window.debugToConsole) {
            console.clear(); // eslint-disable-line no-console
        }
    }
    applyDomChanges(changeEvents, isReverse = false) {
        for (const change of changeEvents) {
            this.pendingDomChanges.push(change);
        }
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
                    this.delegateToChildFrame(changeEvent, isReverse);
                }
                else {
                    window.DomActions.replayDomEvent(changeEvent, isReverse);
                }
            }
            catch (err) {
                debugLog('ERROR applying change', changeEvent, err);
            }
        }
        this.pendingDomChanges.length = 0;
    }
    delegateToChildFrame(event, isReverse) {
        const nodeId = event.frameIdPath
            .replace(window.selfFrameIdPath, '') // replace current path
            .split('_') // get nodeIds
            .filter(Boolean)
            .shift();
        const frameNodeId = Number(nodeId);
        // queue for pending events
        this.pendingDelegatedEventsByChildNodeId[frameNodeId] ??= { isReverse, changes: [] };
        const pending = this.pendingDelegatedEventsByChildNodeId[frameNodeId];
        if (isReverse !== pending.isReverse)
            pending.changes.length = 0;
        pending.changes.push(event);
        pending.isReverse = isReverse;
        this.sendPendingEvents(frameNodeId);
    }
    sendPendingEvents(frameNodeId) {
        const node = window.getNodeById(frameNodeId);
        if (!node)
            return;
        const frame = node;
        if (!frame.contentWindow) {
            debugLog('Frame: without window', frame);
            return;
        }
        if (window.waitForFramesReady && !this.frameContentWindows.get(frame.contentWindow)?.isReady) {
            return;
        }
        const events = this.pendingDelegatedEventsByChildNodeId[frameNodeId];
        if (!events?.changes?.length)
            return;
        this.pendingDelegatedEventsByChildNodeId[frameNodeId] = { changes: [], isReverse: false };
        frame.contentWindow.postMessage({ recipientFrameIdPath: `${window.selfFrameIdPath}_${frameNodeId}`, events, action: 'dom' }, '*');
    }
    setChildFrameIsReady(frameWindow) {
        const entry = this.frameContentWindows.get(frameWindow);
        if (!entry) {
            debugLog('WARN: child frame activated without frameid');
            return;
        }
        entry.isReady = true;
        this.sendPendingEvents(entry.frameNodeId);
    }
    static register() {
        if (window.waitForFramesReady !== true || window.isMainFrame || window.parent === window.self) {
            return;
        }
        try {
            window.parent.postMessage({ action: 'ready' }, '*');
        }
        catch (e) {
            debugLog('ERROR: could not send ready message to parent window');
        }
    }
    static load() {
        const replayer = new DomReplayer();
        window.domReplayer = replayer;
        window.loadPaintEvents = replayer.loadPaintEvents.bind(replayer);
        window.setPaintIndex = replayer.setPaintIndex.bind(replayer);
        window.applyDomChanges = replayer.applyDomChanges.bind(replayer);
        window.addEventListener('message', ev => {
            if (ev.data.action === 'ready') {
                replayer.setChildFrameIsReady(ev.source);
                return;
            }
            if (ev.data.recipientFrameIdPath && !window.selfFrameIdPath) {
                window.selfFrameIdPath = ev.data.recipientFrameIdPath;
            }
            if (ev.data.action === 'dom') {
                replayer.applyDomChanges(ev.data.events.changes, ev.data.events.isReverse);
            }
        });
        if (document.readyState === 'complete') {
            setTimeout(() => DomReplayer.register(), 10);
        }
        else {
            window.addEventListener('DOMContentLoaded', () => DomReplayer.register(), { once: true });
        }
    }
}
// if not defined, set to false
if (!window.isMainFrame)
    window.isMainFrame = false;
DomReplayer.load();
function debugLog(message, ...args) {
    if (window.debugToConsole) {
        // eslint-disable-next-line prefer-rest-params,no-console
        console.log(...arguments);
    }
    window.debugLogs ??= [];
    window.debugLogs.push({ message, args });
}
//# sourceMappingURL=domReplayer.js.map