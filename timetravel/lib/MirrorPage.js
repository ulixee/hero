"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const InjectedScripts_1 = require("@ulixee/hero-core/lib/InjectedScripts");
const DomChangesTable_1 = require("@ulixee/hero-core/models/DomChangesTable");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const fs = require("fs");
const Queue_1 = require("@ulixee/commons/lib/Queue");
const { log } = (0, Logger_1.default)(module);
const installedScriptsSymbol = Symbol.for('MirrorPageScripts');
class MirrorPage extends eventUtils_1.TypedEventEmitter {
    get pageId() {
        return this.page?.id;
    }
    get loadedPaintEvent() {
        return this.domRecording.paintEvents[this.loadedPaintIndex];
    }
    get hasSubscription() {
        return !!this.subscribeToTab;
    }
    get useIsolatedContext() {
        return this.page.installJsPathIntoIsolatedContext;
    }
    constructor(network, domRecording, showChromeInteractions = false, debugLogging = true) {
        super();
        this.network = network;
        this.showChromeInteractions = showChromeInteractions;
        this.debugLogging = debugLogging;
        this.events = new EventSubscriber_1.default();
        this.createdPage = false;
        this.pendingDomChanges = [];
        this.paintEventByTimestamp = {};
        this.isLoadedDocumentDirty = false;
        this.loadQueue = new Queue_1.default(null, 1);
        this.loadedPaintIndex = -1;
        this.setDomRecording(domRecording);
        this.onPageEvents = this.onPageEvents.bind(this);
        this.logger = log.createChild(module);
    }
    async attachToPage(page, sessionId, setReady = true) {
        this.page = page;
        this.logger = log.createChild(module, { sessionId });
        let readyResolvable;
        if (setReady) {
            readyResolvable = new Resolvable_1.default();
            this.isReady = readyResolvable.promise;
        }
        try {
            this.events.once(page, 'close', this.close.bind(this));
            if (this.debugLogging) {
                this.events.on(page, 'console', msg => {
                    this.logger.info('MirrorPage.console', msg);
                });
                this.events.on(page, 'crashed', msg => {
                    this.logger.info('MirrorPage.crashed', msg);
                });
            }
            const promises = [
                page.setNetworkRequestInterceptor(this.network.mirrorNetworkRequests),
            ];
            if (page[installedScriptsSymbol]) {
                promises.push(page.mainFrame.evaluate(`window.domReplayer.reset()`, {
                    isolateFromWebPageEnvironment: this.useIsolatedContext,
                }));
            }
            else {
                promises.push(this.showChromeInteractions
                    ? InjectedScripts_1.default.installInteractionScript(page, this.useIsolatedContext)
                    : null, page.addNewDocumentScript(injectedScript, this.useIsolatedContext));
                page[installedScriptsSymbol] = true;
            }
            await Promise.all(promises);
        }
        catch (error) {
            this.logger.error('ERROR creating mirror page', { error });
            readyResolvable.reject(error);
        }
        finally {
            if (readyResolvable)
                readyResolvable.resolve();
        }
    }
    async openInContext(context, sessionId, viewport, onPage) {
        if (this.isReady)
            return await this.isReady;
        this.sessionId = sessionId;
        this.logger = log.createChild(module, { sessionId });
        const ready = new Resolvable_1.default();
        this.isReady = ready.promise;
        try {
            this.page = await context.newPage(MirrorPage.newPageOptions);
            this.createdPage = true;
            await this.attachToPage(this.page, sessionId, false);
            if (onPage)
                await onPage(this.page);
            if (viewport) {
                await this.page.devtoolsSession.send('Emulation.setDeviceMetricsOverride', {
                    height: viewport.height,
                    width: viewport.width,
                    deviceScaleFactor: viewport.deviceScaleFactor,
                    mobile: false,
                });
            }
        }
        catch (error) {
            ready.reject(error);
        }
        finally {
            ready.resolve();
            this.emit('open');
        }
        return this.isReady;
    }
    async replaceDomRecording(domRecording) {
        await this.loadQueue.run(async () => {
            this.setDomRecording(domRecording);
            if (this.loadedDocument) {
                this.isLoadedDocumentDirty = true;
                await this.injectPaintEvents(this.loadedDocument);
            }
        });
    }
    getPaintIndex(timestamp) {
        this.processPendingDomChanges();
        const paint = this.paintEventByTimestamp[timestamp];
        if (!paint)
            return -1;
        return this.domRecording.paintEvents.indexOf(paint);
    }
    subscribe(tab, cleanupOnTabClose = true) {
        if (this.subscribeToTab)
            throw new Error('This MirrorPage is already subscribed to a tab');
        // NOTE: domNodePathByFrameId and mainFrameIds are live objects
        this.domRecording.domNodePathByFrameId = tab.session.db.frames.frameDomNodePathsById;
        this.domRecording.mainFrameIds = tab.session.db.frames.mainFrameIds(tab.tabId);
        const onPageEvents = this.events.on(tab, 'page-events', this.onPageEvents);
        this.events.once(tab, 'close', () => {
            this.events.off(onPageEvents);
            this.subscribeToTab = null;
            if (cleanupOnTabClose) {
                this.domRecording = null;
                this.loadedPaintIndex = -1;
                this.pendingDomChanges.length = 0;
                this.loadedDocument = null;
                this.isReady = null;
                // @ts-ignore
                this.loadQueue.reset();
            }
            else {
                this.domRecording.domNodePathByFrameId = { ...tab.session.db.frames.frameDomNodePathsById };
                this.domRecording.mainFrameIds = new Set(tab.session.db.frames.mainFrameIds(tab.tabId));
            }
        });
        this.subscribeToTab = tab;
    }
    async load(newPaintIndex, overlayLabel, afterLoadedCb) {
        await this.isReady;
        // only allow 1 load at a time
        return await this.loadQueue.run(async () => {
            if (this.subscribeToTab && !newPaintIndex) {
                await this.subscribeToTab.flushDomChanges();
            }
            this.processPendingDomChanges();
            newPaintIndex ??= this.domRecording.paintEvents.length - 1;
            this.loadedPaintIndex = newPaintIndex;
            const loadingDocument = this.getActiveDocument(newPaintIndex);
            let isLoadingDocument = false;
            if (loadingDocument &&
                (loadingDocument.url !== this.page.mainFrame.url ||
                    newPaintIndex === -1 ||
                    loadingDocument.paintStartTimestamp !== this.loadedDocument?.paintStartTimestamp)) {
                isLoadingDocument = true;
                if (this.debugLogging) {
                    this.logger.info('MirrorPage.navigate', {
                        newPaintIndex,
                        url: loadingDocument.url,
                    });
                }
                const loader = await this.page.navigate(loadingDocument.url);
                this.emit('goto', { url: loadingDocument.url, loaderId: loader.loaderId });
                await this.page.mainFrame.waitForLifecycleEvent('DOMContentLoaded', loader.loaderId);
                this.loadedDocument = loadingDocument;
                this.isLoadedDocumentDirty = true;
            }
            if (this.isLoadedDocumentDirty && this.loadedDocument) {
                await this.injectPaintEvents(this.loadedDocument);
            }
            if (newPaintIndex >= 0) {
                if (this.debugLogging) {
                    this.logger.info('MirrorPage.loadPaintEvents', {
                        newPaintIndex,
                    });
                }
                this.emit('paint', { paintIndex: newPaintIndex });
                const showOverlay = (overlayLabel || isLoadingDocument) && this.showChromeInteractions;
                if (showOverlay)
                    await this.evaluate('window.overlay();');
                await this.evaluate(`window.setPaintIndex(${newPaintIndex});`);
                if (showOverlay) {
                    const options = {
                        notify: overlayLabel,
                        hide: !overlayLabel,
                    };
                    await this.evaluate(`window.overlay(${JSON.stringify(options)});`);
                }
            }
            if (afterLoadedCb)
                return await afterLoadedCb();
        });
    }
    async showInteractions(highlightNodeIds, mouse, scroll) {
        if (!this.showChromeInteractions)
            return;
        const args = [highlightNodeIds, mouse, scroll].map(x => {
            if (!x)
                return 'undefined';
            return JSON.stringify(this.applyFrameNodePath(x));
        });
        await this.evaluate(`window.replayInteractions(${args.join(',')});`);
    }
    async showStatusText(text) {
        if (!this.showChromeInteractions)
            return;
        await this.evaluate(`window.showReplayStatus("${text}");`);
    }
    async close() {
        this.loadQueue.stop();
        if (this.page && !this.page.isClosed) {
            if (this.createdPage) {
                await this.page.close();
            }
            else {
                await this.page.reset();
            }
        }
        this.createdPage = false;
        this.subscribeToTab = null;
        this.page = null;
        this.loadedDocument = null;
        this.network.close();
        this.events.close();
        this.emit('close');
    }
    async getNodeOuterHtml(paintIndex, nodeId, frameElementNodePointerId) {
        return await this.load(paintIndex, null, async () => {
            const frame = await this.getFrameWithDomNodeId(frameElementNodePointerId);
            const url = frame.url;
            const html = await frame.evaluate(`(() => {
     const node = NodeTracker.getWatchedNodeWithId(${nodeId});
     if (node) return node.outerHTML;
     return null;
   })()`, { retriesWaitingForLoad: 2, isolateFromWebPageEnvironment: this.useIsolatedContext });
            return { url, html };
        });
    }
    async outerHTML() {
        return await this.page.mainFrame.outerHTML();
    }
    getDomRecordingSince(sinceTimestamp) {
        this.processPendingDomChanges();
        return {
            mainFrameIds: new Set(this.domRecording.mainFrameIds),
            paintEvents: this.domRecording.paintEvents.map(x => {
                if (x.timestamp <= sinceTimestamp)
                    return { ...x, changeEvents: [] };
                return x;
            }),
            documents: [...this.domRecording.documents],
            domNodePathByFrameId: { ...this.domRecording.domNodePathByFrameId },
        };
    }
    async getFrameWithDomNodeId(frameDomNodeId) {
        if (!frameDomNodeId)
            return this.page.mainFrame;
        for (const frame of this.page.frames) {
            // don't check main frame
            if (!frame.parentId)
                continue;
            try {
                const frameNodePointerId = await frame.getFrameElementNodePointerId();
                if (frameNodePointerId === frameDomNodeId) {
                    return frame;
                }
            }
            catch (error) {
                this.logger.warn('Error matching frame nodeId to environment', {
                    error,
                });
                // just keep looking?
            }
        }
    }
    getActiveDocument(newPaintIndex) {
        let activeDocumentTimestamp = Date.now();
        if (newPaintIndex < 0) {
            if (this.domRecording.documents.length) {
                activeDocumentTimestamp = this.domRecording.documents[0]?.paintStartTimestamp;
            }
        }
        else {
            activeDocumentTimestamp = this.domRecording.paintEvents[newPaintIndex].timestamp;
        }
        let loadingDocument;
        for (const document of this.domRecording.documents) {
            if (!document.isMainframe)
                continue;
            if (document.paintStartTimestamp <= activeDocumentTimestamp) {
                loadingDocument = document;
            }
        }
        return loadingDocument;
    }
    setDomRecording(domRecording) {
        this.domRecording = domRecording;
        this.paintEventByTimestamp = {};
        for (const paint of this.domRecording.paintEvents) {
            this.paintEventByTimestamp[paint.timestamp] = paint;
        }
        for (const document of this.domRecording.documents) {
            this.network.registerDoctype(document.url, document.doctype);
        }
    }
    processPendingDomChanges() {
        if (!this.pendingDomChanges.length)
            return;
        const domChangeRecords = [...this.pendingDomChanges];
        this.pendingDomChanges.length = 0;
        const domRecording = DomChangesTable_1.default.toDomRecording(domChangeRecords, this.domRecording.mainFrameIds, this.domRecording.domNodePathByFrameId);
        const nextDocument = this.loadedDocument
            ? this.domRecording.documents.find(x => x.isMainframe && x.paintStartTimestamp > this.loadedDocument.paintStartTimestamp)
            : null;
        let needsPaintSort = false;
        const lastPaint = this.domRecording.paintEvents[this.domRecording.paintEvents.length - 1];
        for (const paint of domRecording.paintEvents) {
            const existing = this.paintEventByTimestamp[paint.timestamp];
            if (this.loadedDocument && paint.timestamp > this.loadedDocument.paintStartTimestamp) {
                if (!nextDocument || paint.timestamp < nextDocument.paintStartTimestamp) {
                    this.isLoadedDocumentDirty = true;
                }
            }
            if (!existing) {
                needsPaintSort ||= paint.timestamp < lastPaint?.timestamp;
                this.domRecording.paintEvents.push(paint);
                this.paintEventByTimestamp[paint.timestamp] = paint;
            }
            else {
                for (const change of paint.changeEvents) {
                    existing.changeEvents.push(change);
                }
                existing.changeEvents.sort((a, b) => {
                    if (a.frameId === b.frameId)
                        return a.eventIndex - b.eventIndex;
                    return a.frameId - b.frameId;
                });
            }
        }
        if (needsPaintSort) {
            this.domRecording.paintEvents.sort((a, b) => a.timestamp - b.timestamp);
        }
        for (const document of domRecording.documents) {
            document.paintEventIndex = this.domRecording.paintEvents.indexOf(this.paintEventByTimestamp[document.paintStartTimestamp]);
            this.domRecording.documents.push(document);
            this.network.registerDoctype(document.url, document.doctype);
        }
    }
    onPageEvents(event) {
        const { domChanges } = event.records;
        for (const record of domChanges) {
            this.pendingDomChanges.push(record);
        }
    }
    async evaluate(expression) {
        await this.isReady;
        return await this.page.mainFrame.evaluate(expression, {
            isolateFromWebPageEnvironment: this.useIsolatedContext,
            retriesWaitingForLoad: 2,
        });
    }
    applyFrameNodePath(item) {
        if (!item)
            return undefined;
        const result = item;
        result.frameIdPath = this.domRecording.domNodePathByFrameId[item.frameId];
        return result;
    }
    isLoadedDocument(document) {
        if (!this.loadedDocument)
            return false;
        if (this.loadedDocument === document)
            return true;
        return (this.loadedDocument.paintStartTimestamp === document.paintStartTimestamp &&
            this.loadedDocument.url === document.url);
    }
    async injectPaintEvents(document) {
        if (!document.isMainframe)
            throw new Error('Must inject PaintEvents from Mainframe');
        if (this.isLoadedDocument(document) && !this.isLoadedDocumentDirty) {
            return;
        }
        this.loadedDocument = document;
        this.isLoadedDocumentDirty = false;
        const columns = [
            'action',
            'nodeId',
            'nodeType',
            'textContent',
            'tagName',
            'namespaceUri',
            'parentNodeId',
            'previousSiblingId',
            'attributeNamespaces',
            'attributes',
            'properties',
            'frameId',
        ];
        const nextDocument = this.domRecording.documents.find(x => x.isMainframe && x.paintStartTimestamp > document.paintStartTimestamp);
        const tagNames = {};
        const tagNamesById = {};
        let tagCounter = 0;
        const events = [];
        const { paintEvents, domNodePathByFrameId } = this.domRecording;
        for (let idx = 0; idx < paintEvents.length; idx += 1) {
            const changes = [];
            events.push(changes);
            const paintEvent = paintEvents[idx];
            if (!paintEvent || !paintEvent.changeEvents.length)
                continue;
            if (paintEvent.timestamp < document.paintStartTimestamp)
                continue;
            if (nextDocument && paintEvent.timestamp >= nextDocument.paintStartTimestamp)
                continue;
            for (const change of paintEvent.changeEvents) {
                if (change.tagName && tagNames[change.tagName] === undefined) {
                    tagCounter += 1;
                    tagNamesById[tagCounter] = change.tagName;
                    tagNames[change.tagName] = tagCounter;
                }
                const record = columns.map(col => {
                    const prop = change[col];
                    if (col === 'tagName')
                        return tagNames[prop];
                    return prop;
                });
                changes.push(record);
            }
        }
        await this.evaluate(`(function replayEvents(){
    const exports = {};
    window.isMainFrame = true;
    window.selfFrameIdPath = 'main';
    window.showMouseInteractions = true;

    const records = ${JSON.stringify(events).replace(/,null/g, ',')};
    const tagNamesById = ${JSON.stringify(tagNamesById)};
    const domNodePathsByFrameId = ${JSON.stringify(domNodePathByFrameId ?? {})};
    
    const paintEvents = [];
    for (const event of records) {
      const changeEvents = [];
      paintEvents.push(changeEvents);
      for (const [${columns.join(',')}] of event) {
        const event = { ${columns.join(',')} };
        event.frameIdPath = domNodePathsByFrameId[frameId];
        if (frameId && !event.frameIdPath) continue;
        if (event.tagName !== undefined) event.tagName = tagNamesById[event.tagName];
        changeEvents.push(event);
      }
    }

    window.loadPaintEvents(paintEvents);
})();
//# sourceURL=hero/timetravel/MirrorPage.ts`);
    }
}
MirrorPage.newPageOptions = {
    runPageScripts: false,
    enableDomStorageTracker: false,
    installJsPathIntoDefaultContext: true,
};
exports.default = MirrorPage;
const pageScripts = {
    DomActions: fs.readFileSync(`${__dirname}/../injected-scripts/DomActions.js`, 'utf8'),
    domReplayer: fs.readFileSync(`${__dirname}/../injected-scripts/domReplayer.js`, 'utf8'),
    domReplayerUI: fs.readFileSync(`${__dirname}/../injected-scripts/domReplayerUI.js`, 'utf8'),
};
const injectedScript = `(function mirrorInjectedScripts() {
  ${InjectedScripts_1.CorePageInjectedScript};

  ${pageScripts.DomActions};
  ${pageScripts.domReplayer};
  ${pageScripts.domReplayerUI};
  
  window.waitForFramesReady = true;
  window.blockClickAndSubmit = true;
})();`;
//# sourceMappingURL=MirrorPage.js.map