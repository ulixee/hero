import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import InjectedScripts, { CorePageInjectedScript } from '@ulixee/hero-core/lib/InjectedScripts';
import { IMouseEventRecord } from '@ulixee/hero-core/models/MouseEventsTable';
import { IScrollRecord } from '@ulixee/hero-core/models/ScrollEventsTable';
import { IDocument, IDomRecording, IPaintEvent } from '@ulixee/hero-core/models/DomChangesTable';
import Log from '@ulixee/commons/lib/Logger';
import injectedSourceUrl from '@ulixee/hero-interfaces/injectedSourceUrl';
import * as fs from 'fs';
import { IFrontendDomChangeEvent } from '@ulixee/hero-interfaces/IDomChangeEvent';
import MirrorNetwork from './MirrorNetwork';

const { log } = Log(module);

export default class MirrorPage extends TypedEventEmitter<{
  close: void;
  goto: { url: string; loaderId: string };
}> {
  public page: IPuppetPage;
  public isReady: Promise<void>;

  public get puppetPageId(): string {
    return this.page?.id;
  }

  private sessionId: string;
  private loadedDocument: IDocument;

  constructor(
    public network: MirrorNetwork,
    public domRecording: IDomRecording,
    private showBrowserInteractions: boolean = false,
    private debugLogging: boolean = false,
  ) {
    super();
    for (const document of domRecording.documents ?? []) {
      if (document.doctype) this.network.registerDoctype(document.url, document.doctype);
    }
  }

  public async open(
    context: IPuppetContext,
    sessionId: string,
    viewport?: IViewport,
    onPage?: (page: IPuppetPage) => Promise<void>,
  ): Promise<void> {
    if (this.isReady) return await this.isReady;

    this.sessionId = sessionId;
    const ready = new Resolvable<void>();
    this.isReady = ready.promise;
    try {
      this.page = await context.newPage({ runPageScripts: false });
      this.page.once('close', this.close.bind(this));
      if (this.debugLogging || true) {
        this.page.on('console', msg => {
          console.log('MirrorPage.console', {
            ...msg,
            sessionId: this.sessionId,
          });
        });
        this.page.on('crashed', msg => {
          log.info('MirrorPage.crashed', {
            ...msg,
            sessionId: this.sessionId,
          });
        });
      }

      const promises = [];
      if (onPage) promises.push(onPage(this.page));
      promises.push(
        this.page.setNetworkRequestInterceptor(this.network.mirrorNetworkRequests),
        this.page.addNewDocumentScript(detachedInjectedScript, true),
        this.showBrowserInteractions ? InjectedScripts.installInteractionScript(this.page) : null,
        this.page.setJavaScriptEnabled(false),
      );
      if (viewport) {
        promises.push(
          this.page.devtoolsSession.send('Emulation.setDeviceMetricsOverride', {
            height: viewport.height,
            width: viewport.width,
            deviceScaleFactor: viewport.deviceScaleFactor,
            mobile: false,
          }),
        );
      }
      await Promise.all(promises);
    } finally {
      ready.resolve();
    }
  }

  public async replaceDomRecording(domRecording: IDomRecording): Promise<void> {
    this.domRecording = domRecording;
    if (this.loadedDocument) await this.injectPaintEvents(this.loadedDocument);
  }

  public async addDomRecordingUpdates(domRecording: IDomRecording): Promise<void> {
    this.domRecording.domNodePathByFrameId = domRecording.domNodePathByFrameId;

    for (const document of domRecording.documents) {
      if (document.paintEventIndex >= this.domRecording.paintEvents.length) {
        this.domRecording.documents.push(document);
      }
    }

    const { paintEvents } = this.domRecording;

    const paintByTimestamp: { [timestamp: number]: IPaintEvent } = {};
    for (const paint of paintEvents) {
      paintByTimestamp[paint.timestamp] = paint;
    }

    let iteratedPaintIndex = 0;
    for (const paint of domRecording.paintEvents) {
      const existing = paintByTimestamp[paint.timestamp];

      let paintIndex: number;
      if (!existing) {
        paintEvents.push(paint);
        paintIndex = paintEvents.length - 1;
      } else {
        paintIndex = paintEvents.indexOf(existing);
        existing.changeEvents.push(...paint.changeEvents);
        existing.changeEvents.sort((a, b) => {
          if (a.frameId === b.frameId) return a.eventIndex - b.eventIndex;
          return a.frameId - b.frameId;
        });
      }
      // update paint indices
      for (const document of domRecording.documents) {
        if (iteratedPaintIndex === document.paintEventIndex) {
          document.paintEventIndex = paintIndex;
        }
      }
      iteratedPaintIndex += 1;
    }
    if (this.loadedDocument) await this.injectPaintEvents(this.loadedDocument);
  }

  public async navigate(document: IDocument): Promise<void> {
    await this.isReady;
    if (this.debugLogging) {
      log.info('MirrorPage.goto', {
        document,
        sessionId: this.sessionId,
      });
    }
    const page = this.page;
    const loader = await page.navigate(document.url);
    this.emit('goto', { url: document.url, loaderId: loader.loaderId });
    await page.mainFrame.waitForLifecycleEvent('DOMContentLoaded', loader.loaderId);
    await this.injectPaintEvents(document);
  }

  public async load(newPaintIndex?: number, overlayLabel?: string): Promise<void> {
    await this.isReady;
    newPaintIndex ??= this.domRecording.paintEvents.length - 1;

    let loadingDocument: IDocument;
    for (const document of this.domRecording.documents) {
      if (!document.isMainframe) continue;
      if (document.paintEventIndex <= newPaintIndex) {
        loadingDocument = document;
      }
      this.network.registerDoctype(document.url, document.doctype);
    }

    const page = this.page;
    let isLoadingDocument = false;
    if (loadingDocument && loadingDocument.url !== page.mainFrame.url) {
      isLoadingDocument = true;
      await this.navigate(loadingDocument);
    }
    if (newPaintIndex >= 0) {
      if (this.debugLogging) {
        log.info('MirrorPage.loadPaintEvents', {
          newPaintIndex,
          sessionId: this.sessionId,
        });
      }

      const showOverlay = (overlayLabel || isLoadingDocument) && this.showBrowserInteractions;

      if (showOverlay) await this.evaluate('window.overlay();');

      const script: string[] = [];
      script.push(`window.setPaintIndex(${newPaintIndex});`);

      if (showOverlay) {
        const options: { hide?: boolean; notify?: string } = {
          notify: overlayLabel,
          hide: !overlayLabel,
        };
        script.push(`window.overlay(${JSON.stringify(options)});`);
        script.push(`window.repositionInteractElements()`);
      }
      await this.evaluate(`(()=>{ ${script.join('\n')} })()`);
    }
  }

  public async showInteractions(
    highlightNodeIds: { frameId: number; nodeIds: number[] },
    mouse: IMouseEventRecord,
    scroll: IScrollRecord,
  ): Promise<void> {
    const args = [highlightNodeIds, mouse, scroll].map(x => {
      if (!x) return 'undefined';
      return JSON.stringify(this.applyFrameNodePath(x));
    });
    await this.evaluate(`window.replayInteractions(${args.join(',')});`);
  }

  public async showStatusText(text: string): Promise<void> {
    await this.evaluate(`window.showReplayStatus("${text}");`);
  }

  public async close(): Promise<void> {
    if (this.isReady === null) return;
    this.isReady = null;
    if (this.page && !this.page.isClosed) {
      await this.page.close();
    }
    this.page = null;
    this.loadedDocument = null;
    this.network.close();
    this.emit('close');
  }

  public async getHtml(): Promise<string> {
    return await this.evaluate(
      `(() => {
  let retVal = '';
  if (document.doctype)
    retVal = new XMLSerializer().serializeToString(document.doctype);
  if (document.documentElement)
    retVal += document.documentElement.outerHTML;
  return retVal;
})()`,
    );
  }

  private async evaluate<T>(expression: string): Promise<T> {
    await this.isReady;
    return await this.page.mainFrame.evaluate(expression, true, { retriesWaitingForLoad: 2 });
  }

  private applyFrameNodePath<T extends { frameId: number }>(item: T): T & { frameIdPath: string } {
    if (!item) return undefined;
    const result = item as T & { frameIdPath: string };
    result.frameIdPath = this.domRecording.domNodePathByFrameId[item.frameId];
    return result;
  }

  private async injectPaintEvents(document: IDocument): Promise<void> {
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

    const tagNames: { [tagName: string]: number } = {};
    const tagNamesById: { [tagId: number]: string } = {};
    let tagCounter = 0;

    const events: IFrontendDomChangeEvent[][] = [];
    const { paintEvents, domNodePathByFrameId } = this.domRecording;
    this.loadedDocument = document;

    for (let idx = 0; idx < paintEvents.length; idx += 1) {
      const changes = [];
      events.push(changes);
      if (idx < document.paintEventIndex) continue;

      for (const change of paintEvents[idx].changeEvents) {
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

    const records = ${JSON.stringify(events).replace(/,null/g, ',')};
    const tagNamesById = ${JSON.stringify(tagNamesById)};
    const domNodePathsByFrameId = ${JSON.stringify(domNodePathByFrameId ?? {})};
    window.records = { records,tagNamesById, domNodePathsByFrameId};
    const paintEvents = [];
    for (const event of records) {
      const changeEvents = [];
      paintEvents.push(changeEvents);
      for (const [${columns.join(',')}] of event) {
        const event = { ${columns.join(',')} };
        event.frameIdPath = domNodePathsByFrameId[frameId];
        if (event.tagName !== undefined) event.tagName = tagNamesById[event.tagName];
        changeEvents.push(event);
      }
    }

    window.loadPaintEvents(paintEvents);
})();
//# sourceURL=${injectedSourceUrl}`,
    );
  }
}

const pageScripts = {
  DomActions: fs.readFileSync(`${__dirname}/../injected-scripts/DomActions.js`, 'utf8'),
  domReplayer: fs.readFileSync(`${__dirname}/../injected-scripts/domReplayer.js`, 'utf8'),
  domReplayerUI: fs.readFileSync(`${__dirname}/../injected-scripts/domReplayerUI.js`, 'utf8'),
};

const detachedInjectedScript = `(function installDetachedScripts() {
  ${CorePageInjectedScript};

  ${pageScripts.DomActions};
  ${pageScripts.domReplayer};
  ${pageScripts.domReplayerUI};

  window.blockClickAndSubmit = true;
})();`;
