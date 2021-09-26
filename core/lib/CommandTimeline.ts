import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import INavigation from '@ulixee/hero-interfaces/INavigation';
import { LoadStatus } from '@ulixee/hero-interfaces/Location';

export default class CommandTimeline<T extends ICommandMeta = ICommandMeta> {
  public readonly startTime: number;
  public readonly runtimeMs: number = 0;
  public readonly commands: (T & ICommandTimelineOffset)[] = [];
  public readonly navigationsById = new Map<number, INavigation>();

  private readonly commandsFromAllRuns: (T & ICommandTimelineOffset)[] = [];
  private readonly allNavigationsById = new Map<number, INavigation>();

  constructor(commandsFromAllRuns: T[], readonly run: number, allNavigations: INavigation[]) {
    let firstCompletedNav: INavigation;
    for (const navigation of allNavigations) {
      if (!firstCompletedNav && navigation.statusChanges.has(LoadStatus.DomContentLoaded)) {
        firstCompletedNav = navigation;
      }
      this.allNavigationsById.set(navigation.id, navigation);
    }

    const firstHttpRequestedTime = firstCompletedNav?.statusChanges?.get(LoadStatus.HttpRequested);

    for (let i = 0; i < commandsFromAllRuns.length; i += 1) {
      const command = { ...commandsFromAllRuns[i] } as T & ICommandTimelineOffset;
      const prev = commandsFromAllRuns[i - 1];
      command.commandGapMs = 0;
      command.startTime = command.runStartDate;
      // client start date is never copied from a previous run, so you can end up with a newer date than the original run
      if (command.clientStartDate && command.clientStartDate < command.runStartDate) {
        command.startTime = command.clientStartDate;
      }
      if (command.startTime < firstHttpRequestedTime) command.startTime = firstHttpRequestedTime;
      // don't set a negative runtime
      command.runtimeMs = Math.max(command.endDate - command.startTime, 0);

      // only use a gap if the command and previous are from the same run
      if (
        prev?.run === command.run &&
        prev?.reusedCommandFromRun === command.reusedCommandFromRun
      ) {
        command.commandGapMs = Math.max(command.startTime - prev.endDate, 0);
      }
      this.commandsFromAllRuns.push(command);

      if (command.run === this.run) {
        this.startTime ??= command.startTime;
        if (command.reusedCommandFromRun !== undefined && command.reusedCommandFromRun !== null) {
          const lastRun = this.getCommand(command.reusedCommandFromRun, command.id);
          command.commandGapMs = lastRun.commandGapMs;
        }

        command.timelineOffsetStartMs = this.runtimeMs + command.commandGapMs;
        command.timelineOffsetEndMs = command.timelineOffsetStartMs + command.runtimeMs;

        this.runtimeMs = command.timelineOffsetEndMs;

        this.addNavigation(command.startNavigationId);
        this.addNavigation(command.endNavigationId);
        this.commands.push(command);
      }
    }
  }

  public getTimelineOffset(millis: number): number {
    const pct = (100 * millis) / this.runtimeMs;
    return Math.floor(10 * pct) / 10;
  }

  public getTimelineOffsetForTimestamp(timestamp: number): number {
    if (!timestamp) return -1;
    for (const command of this.commands) {
      if (
        timestamp >= command.startTime - command.commandGapMs &&
        timestamp <= command.startTime + command.runtimeMs
      ) {
        const durationMs = timestamp - command.startTime;
        return this.getTimelineOffset(durationMs + command.timelineOffsetStartMs);
      }
    }
    return -1;
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
}

export interface ICommandTimelineOffset {
  startTime: number;
  timelineOffsetStartMs: number;
  timelineOffsetEndMs: number;
  commandGapMs: number;
  runtimeMs: number;
}
