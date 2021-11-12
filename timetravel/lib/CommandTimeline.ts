import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import INavigation, { ContentPaint } from '@ulixee/hero-interfaces/INavigation';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';
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

  private readonly commandsFromAllRuns: (T & ICommandTimelineOffset)[] = [];
  private readonly allNavigationsById = new Map<number, INavigation>();

  constructor(
    commandsFromAllRuns: T[],
    readonly run: number,
    allNavigations: INavigation[],
    timelineSubslice?: [startTime: number, endTime?: number],
  ) {
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

    const timelineStart = timelineSubslice
      ? timelineSubslice[0]
      : this.firstCompletedNavigation?.statusChanges.get(LoadStatus.HttpRequested);
    const timelineEnd = timelineSubslice ? timelineSubslice[1] : null;

    for (let i = 0; i < commandsFromAllRuns.length; i += 1) {
      const command = { ...commandsFromAllRuns[i] } as T & ICommandTimelineOffset;
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

      if (timelineEnd && endDate > timelineEnd) {
        if (command.startTime < timelineEnd) {
          endDate = timelineEnd;
        } else {
          continue;
        }
      }
      // only use a gap if the command and previous are from the same run
      const prev = this.commandsFromAllRuns[this.commandsFromAllRuns.length - 1];
      if (
        prev?.run === command.run &&
        prev?.reusedCommandFromRun === command.reusedCommandFromRun
      ) {
        if (command.startTime < prev.endDate) command.startTime = prev.endDate;
        // if this ended before previous ended, need to skip it (probably in parallel)
        if (endDate < prev.endDate) {
          continue;
        }
        command.commandGapMs = Math.max(command.startTime - prev.endDate, 0);
      }

      // don't set a negative runtime
      command.runtimeMs = Math.max(endDate - command.startTime, 0);

      this.commandsFromAllRuns.push(command);

      if (command.run === this.run) {
        this.startTime ??= command.startTime;
        if (command.reusedCommandFromRun !== undefined && command.reusedCommandFromRun !== null) {
          const lastRun = this.getCommand(command.reusedCommandFromRun, command.id);
          command.commandGapMs = lastRun.commandGapMs;
        }

        command.relativeStartMs = this.runtimeMs + command.commandGapMs;

        this.runtimeMs = command.relativeStartMs + command.runtimeMs;
        this.endTime = endDate;

        this.addNavigation(command.startNavigationId);
        this.addNavigation(command.endNavigationId);
        this.commands.push(command);
      }
    }

    if (timelineEnd && this.endTime < timelineEnd) {
      const addedMillis = timelineEnd - this.endTime;
      this.commands[this.commands.length - 1].runtimeMs += addedMillis;
      this.runtimeMs += addedMillis;
      this.endTime = timelineEnd;
    }
  }

  public getTimestampForOffset(percentOffset: number): number {
    const millis = Math.round(100 * this.runtimeMs * (percentOffset / 100)) / 100;
    return this.startTime + millis;
  }

  public getTimelineOffsetForTimestamp(timestamp: number): number {
    if (!timestamp) return -1;

    for (const command of this.commands) {
      if (
        timestamp >= command.startTime - command.commandGapMs &&
        timestamp <= command.startTime + command.runtimeMs
      ) {
        const msSinceCommandStart = timestamp - command.startTime;
        const adjustedTime = msSinceCommandStart + command.relativeStartMs;

        return this.getTimelineOffsetForRuntimeMillis(adjustedTime);
      }
    }
    return -1;
  }

  public toJSON(): unknown {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      runtimeMs: this.runtimeMs,
      commands: this.commands.map(x => {
        return {
          id: x.id,
          run: x.run,
          reusedCommandFromRun: x.reusedCommandFromRun,
          name: x.name,
          startTime: x.startTime,
          endTime: x.endDate,
          relativeStartMs: x.relativeStartMs,
          commandGapMs: x.commandGapMs,
          runtimeMs: x.runtimeMs,
        }
      })
    }
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

  private getCommand(run: number, commandId: number): T & ICommandTimelineOffset {
    return this.commandsFromAllRuns.find(x => x.run === run && x.id === commandId);
  }

  public static fromSession(
    session: Session,
    timelineRange?: [startTime: number, endTime?: number],
  ): CommandTimeline {
    const commands = session.commands;
    return new CommandTimeline(
      commands.history,
      commands.resumeCounter,
      session.db.frameNavigations.getAllNavigations(),
      timelineRange,
    );
  }

  public static fromDb(
    db: SessionDb,
    timelineRange?: [startTime: number, endTime?: number],
  ): CommandTimeline {
    const commands = db.commands.all().sort((a, b) => {
      if (a.run === b.run) return a.id - b.id;
      return a.run - b.run;
    });

    return new CommandTimeline(
      commands,
      commands[commands.length - 1]?.run ?? 0,
      db.frameNavigations.getAllNavigations(),
      timelineRange,
    );
  }
}

function roundFloor(num: number): number {
  return Math.round(10 * num) / 10;
}
