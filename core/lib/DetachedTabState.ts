import INavigation from '@ulixee/hero-interfaces/INavigation';
import IViewport from '@ulixee/hero-interfaces/IViewport';
import MirrorPage from '@ulixee/hero-timetravel/lib/MirrorPage';
import MirrorNetwork from '@ulixee/hero-timetravel/lib/MirrorNetwork';
import DomChangesTable, {
  IDomChangeRecord,
  IDomRecording,
  IPaintEvent,
} from '../models/DomChangesTable';
import Session from './Session';
import Tab from './Tab';
import SessionsDb from '../dbs/SessionsDb';
import { IJsPathHistory } from './JsPath';
import SessionDb from '../dbs/SessionDb';
import IJsPathResult from '@ulixee/hero-interfaces/IJsPathResult';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';

export default class DetachedTabState {
  public get url(): string {
    return this.initialPageNavigation.finalUrl;
  }

  public get domChangeRange(): { indexRange: [number, number]; timestampRange: [number, number] } {
    if (!this.paintEvents?.length) {
      return { indexRange: [-1, 1], timestampRange: [-1, 1] };
    }
    const firstPaint = this.paintEvents[0];
    const lastPaint = this.paintEvents[this.paintEvents.length - 1];

    const firstChange = firstPaint.changeEvents[0];
    const lastChange = lastPaint.changeEvents[lastPaint.changeEvents.length - 1];
    return {
      indexRange: [firstChange?.eventIndex, lastChange?.eventIndex],
      timestampRange: [firstPaint.timestamp, lastPaint.timestamp],
    };
  }

  public mirrorNetwork: MirrorNetwork;
  public mirrorPage: MirrorPage;

  public get paintEvents(): IPaintEvent[] {
    return this.domRecording.paintEvents;
  }

  private readonly domRecording: IDomRecording;

  constructor(
    readonly sessionDb: SessionDb,
    readonly sourceTabId: number,
    readonly sourceMainFrameIds: Set<number>,
    readonly activeSession: Session,
    readonly detachedAtCommandId: number,
    private readonly initialPageNavigation: INavigation,
    domChangeRecords: IDomChangeRecord[],
    readonly callsitePath: string,
    readonly key?: string,
  ) {
    this.mirrorNetwork = MirrorNetwork.createFromSessionDb(this.sessionDb, this.sourceTabId, {
      hasResponse: true,
      isGetOrDocument: true,
      useResourcesOnce: true,
      ignoreJavascriptRequests: true,
      headersFilter: ['data', /^x-*/, 'set-cookie', 'alt-svc', 'server'],
    });

    this.domRecording = DomChangesTable.toDomRecording(
      domChangeRecords,
      sourceMainFrameIds,
      sessionDb.frames.frameDomNodePathsById,
      true,
    );

    this.mirrorPage = new MirrorPage(
      this.mirrorNetwork,
      this.domRecording,
      activeSession.options.showBrowserInteractions,
      true,
    );
  }

  public async openInNewTab(
    context: IPuppetContext,
    viewport: IViewport,
    label?: string,
  ): Promise<{ detachedTab: Tab; prefetchedJsPaths: IJsPathResult[] }> {
    await this.mirrorPage.open(context, this.sessionDb.sessionId, viewport);
    const newTab = Tab.create(this.activeSession, this.mirrorPage.page, true, this.sourceTabId);
    const navigation = newTab.navigations.onNavigationRequested(
      'goto',
      this.url,
      this.detachedAtCommandId,
      null,
    );
    this.mirrorPage.once('goto', ({ loaderId }) =>
      newTab.navigations.assignLoaderId(navigation, loaderId),
    );
    const jsPath = newTab.mainFrameEnvironment.jsPath;
    newTab.once('close', () => {
      if (jsPath.hasNewExecJsPathHistory) {
        this.saveHistory(jsPath.execHistory);
      }
    });
    await this.mirrorPage.load(undefined, label);
    await newTab.isReady;

    const prefetches = await newTab.mainFrameEnvironment.prefetchExecJsPaths(
      this.getJsPathHistory(),
    );
    return { detachedTab: newTab, prefetchedJsPaths: prefetches };
  }

  public toJSON(): any {
    return {
      domChangeRange: this.domChangeRange,
      frameNavigationId: this.initialPageNavigation.id,
      url: this.url,
      detachedAtCommandId: this.detachedAtCommandId,
    };
  }

  public getJsPathHistory(): IJsPathHistory[] {
    const { scriptInstanceMeta } = this.activeSession.options;
    return SessionsDb.find().findDetachedJsPathCalls(
      scriptInstanceMeta,
      this.callsitePath,
      this.key,
    );
  }

  public saveHistory(history: IJsPathHistory[]): void {
    const { scriptInstanceMeta } = this.activeSession.options;
    SessionsDb.find().recordDetachedJsPathCalls(
      scriptInstanceMeta,
      history,
      this.callsitePath,
      this.key,
    );
  }
}
