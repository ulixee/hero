import INavigation from '@ulixee/hero-interfaces/INavigation';
import IPuppetContext from '@ulixee/hero-interfaces/IPuppetContext';
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
import { ISessionResource } from '../apis/Session.resources';

export default class DetachedTabState {
  public get url(): string {
    return this.initialPageNavigation.finalUrl;
  }

  public detachedAtCommandId: number;

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
  private readonly initialPageNavigation: INavigation;
  private session: Session;

  constructor(
    readonly sourceTab: Tab,
    initialPageNavigation: INavigation,
    domChangeRecords: IDomChangeRecord[],
  ) {
    const session = sourceTab.session;
    this.detachedAtCommandId = session.sessionState.lastCommand.id;
    this.session = session;
    this.initialPageNavigation = initialPageNavigation;
    this.mirrorNetwork = DetachedTabState.createMirrorNetwork(sourceTab);

    const db = sourceTab.session.sessionState.db;

    this.domRecording = DomChangesTable.toDomRecording(
      domChangeRecords,
      new Set([sourceTab.mainFrameId]),
      db.frames.frameDomNodePathsById,
      true,
    );

    this.mirrorPage = new MirrorPage(this.mirrorNetwork, this.domRecording, false);
  }

  public async openInNewTab(context: IPuppetContext, viewport: IViewport): Promise<Tab> {
    await this.mirrorPage.open(context, this.session.id, viewport);
    const newTab = Tab.create(this.sourceTab.session, this.mirrorPage.page, true, this.sourceTab);
    const navigation = newTab.navigations.onNavigationRequested(
      'goto',
      this.url,
      this.detachedAtCommandId,
      null,
    );
    this.mirrorPage.on('goto', ({ loaderId }) =>
      newTab.navigations.assignLoaderId(navigation, loaderId),
    );
    await this.mirrorPage.load();
    await newTab.isReady;
    return newTab;
  }

  public toJSON(): any {
    return {
      domChangeRange: this.domChangeRange,
      url: this.url,
      detachedAtCommandId: this.detachedAtCommandId,
    };
  }

  private static createMirrorNetwork(sourceTab: Tab): MirrorNetwork {
    const db = sourceTab.sessionState.db;
    const resources = sourceTab.sessionState.getResources(sourceTab.id).map(x => {
      return <ISessionResource>{
        url: x.request.url,
        method: x.request.method,
        id: x.id,
        tabId: x.tabId,
        statusCode: x.response?.statusCode,
        type: x.type,
        redirectedToUrl: x.isRedirect ? x.response.url : undefined,
      };
    });

    const mirrorNetwork = new MirrorNetwork({
      headersFilter: ['data', /^x-*/, 'set-cookie', 'alt-svc', 'server'],
      useResourcesOnce: true,
      ignoreJavascriptRequests: true,
    });

    mirrorNetwork.loadResources(
      resources,
      MirrorNetwork.loadResourceFromDb.bind(MirrorNetwork, db),
    );

    return mirrorNetwork;
  }
}
