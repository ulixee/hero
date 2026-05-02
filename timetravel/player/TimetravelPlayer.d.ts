import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
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
    readonly sessionDb: SessionDb;
    readonly context: IMirrorPageContext;
    shouldReloadTicks: boolean;
    activeTabId: number;
    private tabsById;
    private loadedPromise;
    private events;
    constructor(sessionDb: SessionDb, context: IMirrorPageContext);
    loadTab(tabId?: number): Promise<TimetravelTab>;
    close(): Promise<void>;
    setTabState(state: ITabDetails[]): Promise<void>;
    private load;
    private onNewOffset;
    private onNewTickCommand;
    private onNewPaintIndex;
}
export interface IMirrorPageContext {
    getMirrorPage(tabId: number): Promise<MirrorPage>;
    loadTimelineTicks(): ITabDetails[];
}
