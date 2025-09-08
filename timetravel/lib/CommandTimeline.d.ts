import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import INavigation from '@ulixee/unblocked-specification/agent/browser/INavigation';
import ICommandTimelineOffset from '@ulixee/hero-interfaces/ICommandTimelineOffset';
import Session from '@ulixee/hero-core/lib/Session';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';
export default class CommandTimeline<T extends ICommandMeta = ICommandMeta> {
    readonly startTime: number;
    readonly endTime: number;
    readonly runtimeMs: number;
    readonly commands: (T & ICommandTimelineOffset)[];
    readonly navigationsById: Map<number, INavigation>;
    readonly loadedNavigations: Set<INavigation>;
    readonly firstCompletedNavigation: INavigation;
    private readonly allNavigationsById;
    constructor(commands: T[], allNavigations: INavigation[]);
    getTimestampForOffset(percentOffset: number): number;
    getTimelineOffsetForTimestamp(timestamp: number): number;
    toJSON(): unknown;
    private getTimelineOffsetForRuntimeMillis;
    private addNavigation;
    static fromSession(session: Session): CommandTimeline;
    static fromDb(db: SessionDb): CommandTimeline;
}
