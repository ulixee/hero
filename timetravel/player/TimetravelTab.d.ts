import { IPaintEvent } from '@ulixee/hero-core/models/DomChangesTable';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ITimelineMetadata from '@ulixee/hero-interfaces/ITimelineMetadata';
import { ITabDetails, ITick } from './TimetravelTicks';
import MirrorPage from '../lib/MirrorPage';
export default class TimetravelTab extends TypedEventEmitter<{
    'new-tick-command': {
        commandId: number;
        paintIndex: number;
    };
    'new-paint-index': {
        paintIndexRange: [start: number, end: number];
        documentLoadPaintIndex: number;
    };
    'new-offset': {
        url: string;
        playback: 'automatic' | 'manual';
        percentOffset: number;
        focusedRange: [start: number, end: number];
    };
}> {
    private readonly tabDetails;
    readonly mirrorPage: MirrorPage;
    latestStatusMetadata?: ITimelineMetadata;
    get id(): number;
    get ticks(): ITick[];
    get currentTick(): ITick;
    get nextTick(): ITick;
    get previousTick(): ITick;
    get focusedPaintIndexes(): [start: number, end: number];
    currentTimelineOffsetPct: number;
    isPlaying: boolean;
    currentTickIndex: number;
    focusedOffsetRange: [start: number, end: number];
    private events;
    private focusedTickRange;
    constructor(tabDetails: ITabDetails, mirrorPage: MirrorPage);
    updateTabDetails(tabDetails: ITabDetails): void;
    step(direction: 'forward' | 'back'): Promise<boolean>;
    play(onTick?: (tick: ITick) => void): Promise<void>;
    pause(): void;
    close(): void;
    setFocusedOffsetRange(offsetRange: [start: number, end: number]): void;
    findClosestTickIndex(timelineOffset: number): number;
    setTimelineOffset(timelineOffset: number): Promise<void>;
    loadEndState(): Promise<void>;
    loadTickWithCommandId(commandId: number): Promise<void>;
    loadTick(newTickOrIdx: number | ITick, specificTimelineOffset?: number): Promise<void>;
    showLoadStatus(): Promise<void>;
    showStatusText(text: string): Promise<void>;
    getPaintEventAtIndex(index: number): IPaintEvent;
    private emitOffset;
}
