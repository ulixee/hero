import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import { SourceMapSupport } from '@ulixee/commons/lib/SourceMapSupport';
import INavigation, {
  ContentPaint,
} from '@ulixee/unblocked-specification/agent/browser/INavigation';
import { LoadStatus } from '@ulixee/unblocked-specification/agent/browser/Location';
import ICommandTimelineOffset from '@ulixee/hero-interfaces/ICommandTimelineOffset';
import Session from '@ulixee/hero-core/lib/Session';
import SessionDb from '@ulixee/hero-core/dbs/SessionDb';

export default class CommandTimeline<T extends ICommandMeta = ICommandMeta> {
  public readonly startTime: number;
  public readonly endTime: number;
  public readonly runtimeMs: number = 0;
  public readonly commands: (T & ICommandTimelineOffset)[] = [];
  public readonly navigationsById = new Map<number, INavigation>();
  public readonly loadedNavigations = new Set<INavigation>();
  public readonly firstCompletedNavigation: INavigation;

  private readonly allNavigationsById = new Map<number, INavigation>();

  constructor(commands: T[], allNavigations: INavigation[]) {
    for (const navigation of allNavigations) {
      if (
        navigation.statusChanges.has(LoadStatus.DomContentLoaded) &&
        (!this.firstCompletedNavigation ||
          navigation.statusChanges.get(LoadStatus.DomContentLoaded) <
            this.firstCompletedNavigation.statusChanges.get(LoadStatus.DomContentLoaded))
      ) {
        this.firstCompletedNavigation = navigation;
      }
      if (
        navigation.statusChanges.has(LoadStatus.DomContentLoaded) ||
        navigation.statusChanges.has(LoadStatus.AllContentLoaded) ||
        navigation.statusChanges.has(ContentPaint)
      ) {
        this.loadedNavigations.add(navigation);
      }
      this.allNavigationsById.set(navigation.id, navigation);
    }

    const timelineStart = this.firstCompletedNavigation?.statusChanges.get(
      LoadStatus.HttpRequested,
    );

    let isClosed = false;
    for (let i = 0; i < commands.length; i += 1) {
      const command = { ...commands[i] } as T & ICommandTimelineOffset;
      command.commandGapMs = 0;
      command.startTime = command.runStartDate;
      // client start date is never copied from a previous run, so you can end up with a newer date than the original run
      if (command.clientStartDate && command.clientStartDate < command.runStartDate) {
        command.startTime = command.clientStartDate;
      }

      let endDate = command.endDate;
      // if this is within 10 mins, assume it's still going
      if (!endDate && Date.now() - command.startTime < 10 * 60e3) {
        endDate = Date.now();
      }

      if (timelineStart) {
        // if command ends before timeline start, don't include it
        if (endDate < timelineStart) continue;
        // if command runs within range of start, truncate to start
        if (command.startTime < timelineStart && endDate > timelineStart) {
          command.startTime = timelineStart;
        }
      }

      const prev = this.commands[this.commands.length - 1];
      if (prev) {
        if (command.startTime < prev.endDate) command.startTime = prev.endDate;
        // if this ended before previous ended, need to skip it (probably in parallel)
        if (endDate < prev.endDate) {
          continue;
        }
        command.commandGapMs = Math.max(command.startTime - prev.endDate, 0);
      }

      // don't set a negative runtime
      command.runtimeMs = Math.max(endDate - command.startTime, 0);

      this.startTime ??= command.startTime;

      command.relativeStartMs = this.runtimeMs + command.commandGapMs;

      this.runtimeMs = command.relativeStartMs + command.runtimeMs;
      this.endTime = endDate;

      this.addNavigation(command.startNavigationId);
      this.addNavigation(command.endNavigationId);
      this.commands.push(command);
      if (command.name === 'close') isClosed = true;

      if (isClosed) break;
    }
  }

  public getTimestampForOffset(percentOffset: number): number {
    const millis = Math.round(100 * this.runtimeMs * (percentOffset / 100)) / 100;
    return this.startTime + millis;
  }

  public getTimelineOffsetForTimestamp(timestamp: number): number {
    if (!timestamp || timestamp > this.endTime) return -1;

    const runtimeMillis = timestamp - this.startTime;
    return this.getTimelineOffsetForRuntimeMillis(runtimeMillis);
  }

  public toJSON(): unknown {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      runtimeMs: this.runtimeMs,
      commands: this.commands.map(x => {
        return {
          id: x.id,
          name: x.name,
          startTime: x.startTime,
          endTime: x.endDate,
          relativeStartMs: x.relativeStartMs,
          commandGapMs: x.commandGapMs,
          runtimeMs: x.runtimeMs,
          callsite: x.callsite.map(site => SourceMapSupport.getOriginalSourcePosition(site)),
        };
      }),
    };
  }

  private getTimelineOffsetForRuntimeMillis(timelineOffsetMs: number): number {
    return roundFloor((100 * timelineOffsetMs) / this.runtimeMs);
  }

  private addNavigation(id: number): void {
    if (id !== undefined && !this.navigationsById.has(id)) {
      const nav = this.allNavigationsById.get(id);
      this.navigationsById.set(nav.id, nav);
    }
  }

  public static fromSession(session: Session): CommandTimeline {
    const commands = session.commands;
    return new CommandTimeline(commands.history, session.db.frameNavigations.getAllNavigations());
  }

  public static fromDb(db: SessionDb): CommandTimeline {
    const commands = db.commands.all().sort((a, b) => {
      if (a.id === b.id) return a.retryNumber - b.retryNumber;
      return a.id - b.id;
    });
    for (const command of commands) {
      if (typeof command.callsite === 'string') {
        command.callsite = JSON.parse((command.callsite as any) ?? '[]');
      }
    }

    return new CommandTimeline(commands, db.frameNavigations.getAllNavigations());
  }
}

function roundFloor(num: number): number {
  return Math.round(10 * num) / 10;
}
