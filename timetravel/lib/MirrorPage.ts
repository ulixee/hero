import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import IViewport from '@unblocked-web/specifications/agent/browser/IViewport';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import InjectedScripts, { CorePageInjectedScript } from '@ulixee/hero-core/lib/InjectedScripts';
import { IMouseEventRecord } from '@ulixee/hero-core/models/MouseEventsTable';
import { IScrollRecord } from '@ulixee/hero-core/models/ScrollEventsTable';
import DomChangesTable, {
  IDocument,
  IDomChangeRecord,
  IDomRecording,
  IPaintEvent,
} from '@ulixee/hero-core/models/DomChangesTable';
import Log from '@ulixee/commons/lib/Logger';
import * as fs from 'fs';
import { IFrontendDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
import MirrorNetwork from './MirrorNetwork';
import { Tab } from '@ulixee/hero-core';
import { IFrame } from '@unblocked-web/specifications/agent/browser/IFrame';
import Queue from '@ulixee/commons/lib/Queue';
import { ITabEventParams } from '@ulixee/hero-core/lib/Tab';
import Page from '@unblocked-web/agent/lib/Page';
import BrowserContext from '@unblocked-web/agent/lib/BrowserContext';

const { log } = Log(module);

const installedScriptsSymbol = Symbol.for('MirrorPageScripts');

export default class MirrorPage extends TypedEventEmitter<{
  close: void;
  open: void;
  goto: { url: string; loaderId: string };
}> {
  public page: Page;
  public isReady: Promise<void>;

  public get pageId(): string {
    return this.page?.id;
  }

  public domRecording: IDomRecording;

  private events = new EventSubscriber();
  private sessionId: string;
  private pendingDomChanges: IDomChangeRecord[] = [];
  private loadedDocument: IDocument;
  private paintEventByTimestamp: { [timestamp: number]: IPaintEvent } = {};
  private isLoadedDocumentDirty = false;
  private subscribeToTab: Tab;
  private loadQueue = new Queue(null, 1);

  private get useIsolatedContext(): boolean {
    return this.page.installJsPathIntoIsolatedContext;
  }

  constructor(
    public network: MirrorNetwork,
    domRecording: IDomRecording,
    private showChromeInteractions = false,
    private debugLogging = false,
  ) {
    super();
    this.setDomRecording(domRecording);
    this.onPageEvents = this.onPageEvents.bind(this);
  }

  public async attachToPage(page: Page, sessionId: string, setReady = true): Promise<void> {
    this.page = page;
    let readyResolvable: Resolvable<void>;
    if (setReady) {
      readyResolvable = new Resolvable<void>();
      this.isReady = readyResolvable.promise;
    }
    try {
      this.events.once(page, 'close', this.close.bind(this));
      if (this.debugLogging) {
        this.events.on(page, 'console', msg => {
          log.info('MirrorPage.console', {
            ...msg,
            sessionId,
          });
        });
        this.events.on(page, 'crashed', msg => {
          log.info('MirrorPage.crashed', {
            ...msg,
            sessionId,
          });
        });
      }

      const promises: Promise<any>[] = [
        page.setNetworkRequestInterceptor(this.network.mirrorNetworkRequests),
      ];

      if (page[installedScriptsSymbol]) {
        promises.push(
          page.mainFrame.evaluate(`window.domReplayer.reset()`, this.useIsolatedContext),
        );
      } else {
        promises.push(
          this.showChromeInteractions
            ? InjectedScripts.installInteractionScript(page, this.useIsolatedContext)
            : null,
          page
            .addNewDocumentScript(injectedScript, this.useIsolatedContext)
            .then(() => page.reload()),
        );
      }
      await Promise.all(promises);
    } finally {
      if (readyResolvable) readyResolvable.resolve();
    }
  }

  public async open(
    context: BrowserContext,
    sessionId: string,
    viewport?: IViewport,
    onPage?: (page: Page) => Promise<void>,
  ): Promise<void> {
    if (this.isReady) return await this.isReady;

    this.sessionId = sessionId;
    const ready = new Resolvable<void>();
    this.isReady = ready.promise;
    try {
      this.page = await context.newPage({
        runPageScripts: false,
        enableDomStorageTracker: false,
        installJsPathIntoDefaultContext: true,
      });
      await this.attachToPage(this.page, sessionId, false);

      if (onPage) await onPage(this.page);
      if (viewport) {
        await this.page.devtoolsSession.send('Emulation.setDeviceMetricsOverride', {
          height: viewport.height,
          width: viewport.width,
          deviceScaleFactor: viewport.deviceScaleFactor,
          mobile: false,
        });
      }
    } finally {
      ready.resolve();
      this.emit('open');
    }
  }

  public async replaceDomRecording(domRecording: IDomRecording): Promise<void> {
    await this.loadQueue.run(async () => {
      this.setDomRecording(domRecording);
      if (this.loadedDocument) {
        this.isLoadedDocumentDirty = true;
        await this.injectPaintEvents(this.loadedDocument);
      }
    });
  }

  public getPaintIndex(timestamp: number): number {
    this.processPendingDomChanges();
    const paint = this.paintEventByTimestamp[timestamp];
    if (!paint) return -1;
    return this.domRecording.paintEvents.indexOf(paint);
  }

  public subscribe(tab: Tab): void {
    if (this.subscribeToTab) throw new Error('This MirrorPage is already subscribed to a tab');

    // NOTE: domNodePathByFrameId and mainFrameIds are live objects
    this.domRecording.domNodePathByFrameId = tab.session.db.frames.frameDomNodePathsById;
    this.domRecording.mainFrameIds = tab.session.db.frames.mainFrameIds(tab.tabId);
    const onPageEvents = this.events.on(tab, 'page-events', this.onPageEvents);
    this.events.once(tab, 'close', () => {
      this.events.off(onPageEvents);
      this.subscribeToTab = null;
      this.domRecording = null;
      this.isReady = null;
      // @ts-ignore
      this.loadQueue.reset();
    });
    this.subscribeToTab = tab;
  }

  public async load<T = void>(
    newPaintIndex?: number,
    overlayLabel?: string,
    afterLoadedCb?: () => Promise<T>,
  ): Promise<T> {
    await this.isReady;
    // only allow 1 load at a time
    return await this.loadQueue.run<T>(async () => {
      if (this.subscribeToTab && !newPaintIndex) {
        await this.subscribeToTab.flushDomChanges();
      }
      this.processPendingDomChanges();
      newPaintIndex ??= this.domRecording.paintEvents.length - 1;

      const loadingDocument = this.getActiveDocument(newPaintIndex);

      let isLoadingDocument = false;
      if (
        loadingDocument &&
        (loadingDocument.url !== this.page.mainFrame.url ||
          newPaintIndex === -1 ||
          loadingDocument.paintStartTimestamp !== this.loadedDocument?.paintStartTimestamp)
      ) {
        isLoadingDocument = true;

        if (this.debugLogging) {
          log.info('MirrorPage.navigate', {
            newPaintIndex,
            url: loadingDocument.url,
            sessionId: this.sessionId,
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
          log.info('MirrorPage.loadPaintEvents', {
            newPaintIndex,
            sessionId: this.sessionId,
          });
        }

        const showOverlay = (overlayLabel || isLoadingDocument) && this.showChromeInteractions;

        if (showOverlay) await this.evaluate('window.overlay();');

        await this.evaluate(`window.setPaintIndex(${newPaintIndex});`);

        if (showOverlay) {
          const options = {
            notify: overlayLabel,
            hide: !overlayLabel,
          };
          await this.evaluate(`window.overlay(${JSON.stringify(options)});`);
        }
      }
      if (afterLoadedCb) return await afterLoadedCb();
    });
  }

  public async showInteractions(
    highlightNodeIds: { frameId: number; nodeIds: number[] },
    mouse: IMouseEventRecord,
    scroll: IScrollRecord,
  ): Promise<void> {
    if (!this.showChromeInteractions) return;
    const args = [highlightNodeIds, mouse, scroll].map(x => {
      if (!x) return 'undefined';
      return JSON.stringify(this.applyFrameNodePath(x));
    });
    await this.evaluate(`window.replayInteractions(${args.join(',')});`);
  }

  public async showStatusText(text: string): Promise<void> {
    if (!this.showChromeInteractions) return;
    await this.evaluate(`window.showReplayStatus("${text}");`);
  }

  public async close(): Promise<void> {
    if (this.isReady === null) return;
    this.isReady = null;
    this.loadQueue.stop();
    if (this.page && !this.page.isClosed) {
      await this.page.close();
    }
    this.subscribeToTab = null;
    this.page = null;
    this.loadedDocument = null;
    this.network.close();
    this.events.close();
    this.emit('close');
    this.removeAllListeners();
  }

  public async getNodeOuterHtml(
    paintIndex: number,
    nodeId: number,
    frameElementNodePointerId?: number,
  ): Promise<{ html: string; url: string }> {
    return await this.load(paintIndex, null, async () => {
      const frame = await this.getFrameWithDomNodeId(frameElementNodePointerId);
      const url = frame.url;
      const html = await frame.evaluate<string>(
        `(() => {
     const node = NodeTracker.getWatchedNodeWithId(${nodeId});
     if (node) return node.outerHTML;
     return null;
   })()`,
        this.useIsolatedContext,
        { retriesWaitingForLoad: 2 },
      );
      return { url, html };
    });
  }

  public async outerHTML(): Promise<string> {
    return await this.page.mainFrame.outerHTML();
  }

  public getDomRecordingSince(sinceTimestamp: number): IDomRecording {
    this.processPendingDomChanges();
    return {
      mainFrameIds: new Set(this.domRecording.mainFrameIds),
      paintEvents: this.domRecording.paintEvents.map(x => {
        if (x.timestamp <= sinceTimestamp) return { ...x, changeEvents: [] };
        return x;
      }),
      documents: [...this.domRecording.documents],
      domNodePathByFrameId: { ...this.domRecording.domNodePathByFrameId },
    };
  }

  private async getFrameWithDomNodeId(frameDomNodeId: number): Promise<IFrame> {
    if (!frameDomNodeId) return this.page.mainFrame;
    for (const frame of this.page.frames) {
      // don't check main frame
      if (!frame.parentId) continue;

      try {
        const frameNodePointerId = await frame.getFrameElementNodePointerId();
        if (frameNodePointerId === frameDomNodeId) {
          return frame;
        }
      } catch (error) {
        this.logger.warn('Error matching frame nodeId to environment', { error });
        // just keep looking?
      }
    }
  }

  private getActiveDocument(newPaintIndex: number): IDocument {
    let activeDocumentTimestamp = Date.now();
    if (newPaintIndex < 0) {
      if (this.domRecording.documents.length) {
        activeDocumentTimestamp = this.domRecording.documents[0]?.paintStartTimestamp;
      }
    } else {
      activeDocumentTimestamp = this.domRecording.paintEvents[newPaintIndex].timestamp;
    }
    let loadingDocument: IDocument;
    for (const document of this.domRecording.documents) {
      if (!document.isMainframe) continue;
      if (document.paintStartTimestamp <= activeDocumentTimestamp) {
        loadingDocument = document;
      }
    }
    return loadingDocument;
  }

  private setDomRecording(domRecording: IDomRecording): void {
    this.domRecording = domRecording;
    this.paintEventByTimestamp = {};
    for (const paint of this.domRecording.paintEvents) {
      this.paintEventByTimestamp[paint.timestamp] = paint;
    }
    for (const document of this.domRecording.documents) {
      this.network.registerDoctype(document.url, document.doctype);
    }
  }

  private processPendingDomChanges(): void {
    if (!this.pendingDomChanges.length) return;

    const domChangeRecords = [...this.pendingDomChanges];
    this.pendingDomChanges.length = 0;
    const domRecording = DomChangesTable.toDomRecording(
      domChangeRecords,
      this.domRecording.mainFrameIds,
      this.domRecording.domNodePathByFrameId,
    );

    const nextDocument = this.loadedDocument
      ? this.domRecording.documents.find(
          x => x.isMainframe && x.paintStartTimestamp > this.loadedDocument.paintStartTimestamp,
        )
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
      } else {
        existing.changeEvents.push(...paint.changeEvents);
        existing.changeEvents.sort((a, b) => {
          if (a.frameId === b.frameId) return a.eventIndex - b.eventIndex;
          return a.frameId - b.frameId;
        });
      }
    }
    if (needsPaintSort) {
      this.domRecording.paintEvents.sort((a, b) => a.timestamp - b.timestamp);
    }

    for (const document of domRecording.documents) {
      document.paintEventIndex = this.domRecording.paintEvents.indexOf(
        this.paintEventByTimestamp[document.paintStartTimestamp],
      );
      this.domRecording.documents.push(document);
      this.network.registerDoctype(document.url, document.doctype);
    }
  }

  private onPageEvents(event: ITabEventParams['page-events']): void {
    const { domChanges } = event.records;
    this.pendingDomChanges.push(...domChanges);
  }

  private async evaluate<T>(expression: string): Promise<T> {
    await this.isReady;
    return await this.page.mainFrame.evaluate(expression, this.useIsolatedContext, {
      retriesWaitingForLoad: 2,
    });
  }

  private applyFrameNodePath<T extends { frameId: number }>(item: T): T & { frameIdPath: string } {
    if (!item) return undefined;
    const result = item as T & { frameIdPath: string };
    result.frameIdPath = this.domRecording.domNodePathByFrameId[item.frameId];
    return result;
  }

  private isLoadedDocument(document: IDocument): boolean {
    if (!this.loadedDocument) return false;
    if (this.loadedDocument === document) return true;
    return (
      this.loadedDocument.paintStartTimestamp === document.paintStartTimestamp &&
      this.loadedDocument.url === document.url
    );
  }

  private async injectPaintEvents(document: IDocument): Promise<void> {
    if (!document.isMainframe) throw new Error('Must inject PaintEvents from Mainframe');
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
    ] as const;

    const nextDocument = this.domRecording.documents.find(
      x => x.isMainframe && x.paintStartTimestamp > document.paintStartTimestamp,
    );

    const tagNames: { [tagName: string]: number } = {};
    const tagNamesById: { [tagId: number]: string } = {};
    let tagCounter = 0;

    const events: IFrontendDomChangeEvent[][] = [];
    const { paintEvents, domNodePathByFrameId } = this.domRecording;
    for (let idx = 0; idx < paintEvents.length; idx += 1) {
      const changes = [];
      events.push(changes);

      const paintEvent = paintEvents[idx];
      if (!paintEvent || !paintEvent.changeEvents.length) continue;
      if (paintEvent.timestamp < document.paintStartTimestamp) continue;
      if (nextDocument && paintEvent.timestamp >= nextDocument.paintStartTimestamp) continue;

      for (const change of paintEvent.changeEvents) {
        if (change.tagName && tagNames[change.tagName] === undefined) {
          tagCounter += 1;
          tagNamesById[tagCounter] = change.tagName;
          tagNames[change.tagName] = tagCounter;
        }
        const record = columns.map(col => {
          const prop = change[col];
          if (col === 'tagName') return tagNames[prop as string];
          return prop;
        });
        changes.push(record);
      }
    }

    await this.evaluate(
      `(function replayEvents(){
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
//# sourceURL=hero/timetravel/MirrorPage.ts`,
    );
  }
}

const pageScripts = {
  DomActions: fs.readFileSync(`${__dirname}/../injected-scripts/DomActions.js`, 'utf8'),
  domReplayer: fs.readFileSync(`${__dirname}/../injected-scripts/domReplayer.js`, 'utf8'),
  domReplayerUI: fs.readFileSync(`${__dirname}/../injected-scripts/domReplayerUI.js`, 'utf8'),
};

const injectedScript = `(function mirrorInjectedScripts() {
  ${CorePageInjectedScript};

  ${pageScripts.DomActions};
  ${pageScripts.domReplayer};
  ${pageScripts.domReplayerUI};
  
  window.waitForFramesReady = true;
  window.blockClickAndSubmit = true;
})();`;
