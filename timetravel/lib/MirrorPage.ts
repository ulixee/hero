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

  constructor(
    public network: MirrorNetwork,
    public domRecording: IDomRecording,
    private showBrowserInteractions: boolean = false,
    private debugLogging: boolean = false,
  ) {
    super();
    network.documents = domRecording.documents;
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
      this.page.on('close', this.close.bind(this));
      if (this.debugLogging) {
        this.page.on('console', console => {
          log.info('MirrorPage.console', {
            ...console,
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

  public async updateDomRecording(domRecording: IDomRecording): Promise<void> {
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
    await this.injectPaintEvents();
  }

  public async navigate(url: string): Promise<void> {
    if (this.debugLogging) {
      log.info('MirrorPage.goto', {
        url,
        sessionId: this.sessionId,
      });
    }
    const page = this.page;
    const loader = await page.navigate(url);
    this.emit('goto', { url, loaderId: loader.loaderId });
    await page.mainFrame.waitForLoad('DOMContentLoaded');
    await this.injectPaintEvents();
  }

  public async load(paintIndexRange?: [number, number]): Promise<void> {
    paintIndexRange ??= [0, this.domRecording.paintEvents.length - 1];
    let [startIndex] = paintIndexRange;
    const endIndex = paintIndexRange[1];

    let loadingDocument: IDocument;
    for (const document of this.network.documents) {
      if (!document.isMainframe) continue;
      if (document.paintEventIndex >= startIndex && document.paintEventIndex <= endIndex) {
        loadingDocument = document;
        if (document.paintEventIndex > startIndex) startIndex = document.paintEventIndex;
      }
    }

    const page = this.page;
    let isLoadingDocument = false;
    if (loadingDocument && loadingDocument.url !== page.mainFrame.url) {
      isLoadingDocument = true;
      await this.navigate(loadingDocument.url);
    }
    if (startIndex >= 0) {
      if (this.debugLogging) {
        log.info('MirrorPage.loadPaintEvents', {
          paintIndexRange,
          sessionId: this.sessionId,
        });
      }
      const showOverlay = isLoadingDocument && this.showBrowserInteractions;

      if (showOverlay) await this.evaluate(`window.showReplayOverlay();`);

      await this.evaluate(`window.setPaintIndexRange(${startIndex}, ${endIndex});`);
      if (showOverlay) await this.evaluate(`window.hideReplayOverlay();`);
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
    this.isReady = null;
    if (this.page && !this.page.isClosed) {
      await this.page.close();
    }
    this.page = null;
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
    return await this.page.mainFrame.evaluate(expression, true);
  }

  private applyFrameNodePath<T extends { frameId: number }>(item: T): T & { frameIdPath: string } {
    if (!item) return undefined;
    const result = item as T & { frameIdPath: string };
    result.frameIdPath = this.domRecording.domNodePathByFrameId[item.frameId];
    return result;
  }

  private async injectPaintEvents(): Promise<void> {
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

    for (const event of paintEvents) {
      const changes = [];
      events.push(changes);
      for (const change of event.changeEvents) {
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
    window.records=  { records,tagNamesById, domNodePathsByFrameId};
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
