import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
import { IMouseEventRecord } from '@ulixee/hero-core/models/MouseEventsTable';
import { IFocusRecord } from '@ulixee/hero-core/models/FocusEventsTable';
import { IScrollRecord } from '@ulixee/hero-core/models/ScrollEventsTable';
import { IDomRecording } from '@ulixee/hero-core/models/DomChangesTable';
import CommandTimeline from '../lib/CommandTimeline';
export default class TimetravelTicks {
    readonly sessionDb: SessionDb;
    private timelineRange?;
    get tabs(): ITabDetails[];
    timeline: CommandTimeline;
    private tabsById;
    constructor(sessionDb: SessionDb, timelineRange?: [startTime: number, endTime?: number]);
    load(domRecordingsWithTabId?: {
        tabId: number;
        domRecording: IDomRecording;
    }[], commandTimeline?: CommandTimeline): ITabDetails[];
    private createCommandTicks;
    private createInteractionTicks;
    private createPaintTicks;
    private sortTicks;
    private addTick;
    static loadDomRecording(sessionDb: SessionDb): {
        tabId: number;
        domRecording: IDomRecording;
    }[];
}
export interface ITabDetails {
    tabId: number;
    ticks: ITick[];
    mouse?: IMouseEventRecord[];
    focus?: IFocusRecord[];
    scroll?: IScrollRecord[];
    domRecording?: IDomRecording;
}
export interface ITick {
    eventType: 'command' | 'paint' | 'focus' | 'mouse' | 'scroll' | 'init';
    eventTypeIndex: number;
    commandId: number;
    timestamp: number;
    timelineOffsetPercent: number;
    isMajor: boolean;
    label?: string;
    isNewDocumentTick: boolean;
    documentUrl: string;
    documentLoadPaintIndex: number;
    highlightNodeIds?: {
        frameId: number;
        nodeIds: number[];
    };
    paintEventIndex?: number;
    scrollEventIndex?: number;
    focusEventIndex?: number;
    mouseEventIndex?: number;
}
