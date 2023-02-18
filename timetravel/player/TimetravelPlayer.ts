import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import TimetravelTab from './TimetravelTab';
import MirrorPage from '../lib/MirrorPage';
import { ITabDetails } from './TimetravelTicks';

export default class TimetravelPlayer extends TypedEventEmitter<{
  'new-tick-command': {
    commandId: number;
    paintIndex: number;
  };
  'new-paint-index': {
    tabId: number;
    paintIndexRange: [start: number, end: number];
    documentLoadPaintIndex: number;
  };
  'new-offset': {
    tabId: number;
    url: string;
    playback: 'automatic' | 'manual';
    percentOffset: number;
    focusedRange: [start: number, end: number];
  };
}> {
  public shouldReloadTicks = false;
  public activeTabId: number;
  private tabsById = new Map<number, TimetravelTab>();
  private loadedPromise: Resolvable<void>;
  private events = new EventSubscriber();

  constructor(readonly sessionDb: SessionDb, readonly context: IMirrorPageContext) {
    super();
  }

  public async loadTab(tabId?: number): Promise<TimetravelTab> {
    await this.load();
    tabId ??= this.activeTabId ?? [...this.tabsById.keys()][0];
    if (tabId) this.activeTabId = tabId;
    return this.tabsById.get(tabId);
  }

  public async close(): Promise<void> {
    this.loadedPromise = null;
    this.events.close();
    for (const tab of this.tabsById.values()) {
      await tab.close();
    }
    this.activeTabId = null;
    this.tabsById.clear();
  }

  public async setTabState(state: ITabDetails[]): Promise<void> {
    this.loadedPromise ??= new Resolvable();

    for (const tabDetails of state) {
      const timetravelTab = this.tabsById.get(tabDetails.tabId);
      if (timetravelTab) {
        timetravelTab.updateTabDetails(tabDetails);
        continue;
      }
      const mirrorPage = await this.context.getMirrorPage(tabDetails.tabId);
      const tab = new TimetravelTab(tabDetails, mirrorPage);
      this.events.on(tab, 'new-offset', this.onNewOffset.bind(this, tabDetails.tabId));
      this.events.on(tab, 'new-paint-index', this.onNewPaintIndex.bind(this, tabDetails.tabId));
      this.events.on(tab, 'new-tick-command', this.onNewTickCommand.bind(this));
      this.tabsById.set(tabDetails.tabId, tab);

      this.activeTabId ??= tabDetails.tabId;
    }
    this.loadedPromise.resolve();
  }

  private async load(): Promise<void> {
    if (this.loadedPromise && !this.shouldReloadTicks) return this.loadedPromise;
    const state = this.context.loadTimelineTicks();
    this.shouldReloadTicks = false;
    await this.setTabState(state);
  }

  private onNewOffset(tabId: number, event: TimetravelTab['EventTypes']['new-offset']): void {
    this.emit('new-offset', { ...event, tabId });
  }

  private onNewTickCommand(event: TimetravelTab['EventTypes']['new-tick-command']): void {
    this.emit('new-tick-command', event);
  }

  private onNewPaintIndex(
    tabId: number,
    event: TimetravelTab['EventTypes']['new-paint-index'],
  ): void {
    this.emit('new-paint-index', { ...event, tabId });
  }
}

export interface IMirrorPageContext {
  getMirrorPage(tabId: number): Promise<MirrorPage>;
  loadTimelineTicks(): ITabDetails[];
}
