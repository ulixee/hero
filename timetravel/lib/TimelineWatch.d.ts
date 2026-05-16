import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import { Session } from '@ulixee/hero-core';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
export default class TimelineWatch extends TypedEventEmitter<{
    updated: void;
}> {
    readonly heroSession: Session;
    readonly timelineExtenders?: {
        extendAfterCommands?: number;
        extendAfterLoadStatus?: {
            status: LoadStatus;
            msAfterStatus: number;
        };
    };
    private closeTimer;
    private readonly events;
    private extendTimelineUntilTimestamp;
    private logger;
    constructor(heroSession: Session, timelineExtenders?: {
        extendAfterCommands?: number;
        extendAfterLoadStatus?: {
            status: LoadStatus;
            msAfterStatus: number;
        };
    });
    close(): void;
    private onCommandFinish;
    private onHeroSessionWillClose;
    private onTabCreated;
    private onStatusChange;
}
