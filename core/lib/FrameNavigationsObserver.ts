import { assert } from '@ulixee/commons/lib/utils';
import {
  ILoadStatus,
  ILocationTrigger,
  LoadStatus,
  LoadStatusPipeline,
  LocationStatus,
  LocationTrigger,
} from '@ulixee/hero-interfaces/Location';
import INavigation, {
  ContentPaint,
  NavigationReason,
  NavigationStatus,
} from '@ulixee/hero-interfaces/INavigation';
import type ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import type IWaitForOptions from '@ulixee/hero-interfaces/IWaitForOptions';
import type IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import type { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import type FrameNavigations from './FrameNavigations';
import Resolvable from '@ulixee/commons/lib/Resolvable';

interface IStatusTrigger {
  status: LocationStatus;
  resolvable: IResolvablePromise<INavigation>;
  startCommandId: number;
  waitingForLoadTimeout?: NodeJS.Timeout;
}

export default class FrameNavigationsObserver {
  private readonly navigations: FrameNavigations;

  // this is the default "starting" point for a wait-for location change if a previous command id is not specified
  private defaultWaitForLocationCommandId = 0;

  private resourceIdResolvable: IResolvablePromise<number>;
  private logger: IBoundLog;
  private readonly statusTriggers: IStatusTrigger[] = [];

  constructor(navigations: FrameNavigations) {
    this.navigations = navigations;
    this.logger = navigations.logger.createChild(module);
    navigations.on('status-change', this.onLoadStatusChange.bind(this));
  }

  // this function will find the "starting command" to look for waitForLocation(change/reload)
  public willRunCommand(newCommand: ICommandMeta, previousCommands: ICommandMeta[]): void {
    let last: ICommandMeta;
    for (const command of previousCommands) {
      // if this is a goto, set this to the "waitForLocation(change/reload)" command marker
      if (command.name === 'goto') this.defaultWaitForLocationCommandId = command.id;
      // find the last "waitFor" command that is not followed by another waitFor
      if (last?.name.startsWith('waitFor') && !command.name.startsWith('waitFor')) {
        this.defaultWaitForLocationCommandId = command.id;
      }
      last = command;
    }
    // handle cases like waitForLocation two times in a row
    if (
      newCommand.name === 'waitForLocation' &&
      last &&
      last.name.startsWith('waitFor') &&
      last.name !== 'waitForMillis'
    ) {
      this.defaultWaitForLocationCommandId = newCommand.id;
    }
  }

  public waitForLocation(
    status: ILocationTrigger,
    options: IWaitForOptions = {},
  ): Promise<INavigation> {
    assert(LocationTrigger[status], `Invalid location status: ${status}`);

    // determine if this location trigger has already been satisfied
    const sinceCommandId = Number.isInteger(options.sinceCommandId)
      ? options.sinceCommandId
      : this.defaultWaitForLocationCommandId;

    const trigger = this.hasLocationTrigger(status, sinceCommandId);
    if (trigger) return Promise.resolve(trigger);
    // otherwise set pending
    return this.createStatusTriggeredPromise(status, options.timeoutMs, sinceCommandId);
  }

  public waitForLoad(status: ILoadStatus, options: IWaitForOptions = {}): Promise<INavigation> {
    assert(LoadStatus[status], `Invalid load status: ${status}`);

    if (options.sinceCommandId) {
      throw new Error('Not implemented');
    }

    const top = this.navigations.top;
    if (top && top.statusChanges.has(status)) return Promise.resolve(top);

    const promise = this.createStatusTriggeredPromise(
      status,
      options.timeoutMs,
      options.sinceCommandId,
    );

    if (top) this.onLoadStatusChange();
    return promise;
  }

  public waitForReady(): Promise<INavigation> {
    return this.waitForLoad(LoadStatus.DomContentLoaded);
  }

  public async waitForNavigationResourceId(): Promise<number> {
    const top = this.navigations.top;

    this.resourceIdResolvable = top?.resourceIdResolvable;
    const resourceId = await this.resourceIdResolvable?.promise;
    if (top?.navigationError) {
      throw top.navigationError;
    }
    return resourceId;
  }

  public cancelWaiting(cancelMessage: string): void {
    const statusPromises: IResolvablePromise[] = [];
    for (const status of this.statusTriggers) {
      clearTimeout(status.waitingForLoadTimeout);
      statusPromises.push(status.resolvable);
    }
    this.statusTriggers.length = 0;

    for (const promise of [this.resourceIdResolvable, ...statusPromises]) {
      if (!promise || promise.isResolved) continue;

      const canceled = new CanceledPromiseError(cancelMessage);
      canceled.stack += `\n${'------LOCATION'.padEnd(50, '-')}\n${promise.stack}`;
      promise.reject(canceled);
    }
  }

  private onLoadStatusChange(): void {
    for (const trigger of [...this.statusTriggers]) {
      if (trigger.resolvable.isResolved) continue;

      if (trigger.status === LocationTrigger.change || trigger.status === LocationTrigger.reload) {
        const resolver = this.hasLocationTrigger(trigger.status, trigger.startCommandId);
        if (resolver) {
          this.resolvePendingTrigger(trigger, trigger.status, resolver);
        }
      } else if (trigger.status === LoadStatus.PaintingStable) {
        this.refreshPendingLoadTrigger(trigger);
      } else {
        const top = this.navigations.top;
        const resolution = this.getResolutionStatus(trigger);
        if (resolution !== null) {
          this.resolvePendingTrigger(trigger, resolution, top);
        }
      }
    }
  }

  private getResolutionStatus(trigger: IStatusTrigger): NavigationStatus {
    const desiredPipeline = LoadStatusPipeline[trigger.status];

    // otherwise just look for state changes > the trigger
    const top = this.navigations.top;
    for (const statusChange of top.statusChanges.keys()) {
      // don't resolve states for redirected
      if (statusChange === LoadStatus.HttpRedirected) continue;

      let pipelineStatus: number = LoadStatusPipeline[statusChange];
      if (statusChange === LoadStatus.AllContentLoaded) {
        pipelineStatus = LoadStatusPipeline.AllContentLoaded;
      }
      if (pipelineStatus >= desiredPipeline) {
        return statusChange;
      }
    }
    return null;
  }

  private refreshPendingLoadTrigger(trigger: IStatusTrigger): void {
    clearTimeout(trigger.waitingForLoadTimeout);

    const { isStable, timeUntilReadyMs } = this.navigations.getPaintStableStatus();

    if (isStable) {
      this.resolvePendingTrigger(trigger, 'PaintingStable + Load', this.navigations.top);
      return;
    }

    if (timeUntilReadyMs === undefined) return;

    trigger.waitingForLoadTimeout = setTimeout(() => {
      const top = this.navigations.top;
      const loadDate = top.statusChanges.get(LoadStatus.AllContentLoaded);
      const contentPaintDate = top.statusChanges.get(ContentPaint);
      this.resolvePendingTrigger(
        trigger,
        `TimeElapsed. Loaded="${loadDate}", ContentPaint="${contentPaintDate}"`,
        top,
      );
    }, timeUntilReadyMs).unref();
  }

  private resolvePendingTrigger(
    trigger: IStatusTrigger,
    resolvedWithStatus: string,
    navigation: INavigation,
  ): void {
    if (!trigger.resolvable.isResolved) {
      this.logger.info(`Resolving pending "${trigger.status}" with trigger`, {
        resolvedWithStatus,
        waitingForStatus: trigger.status,
        url: navigation.finalUrl ?? navigation.requestedUrl,
      });
    }

    clearTimeout(trigger.waitingForLoadTimeout);
    trigger.resolvable.resolve(navigation);
    const index = this.statusTriggers.indexOf(trigger);
    if (index >= 0) this.statusTriggers.splice(index, 1);
  }

  private hasLocationTrigger(
    trigger: ILocationTrigger,
    sinceCommandId: number,
  ): INavigation | null {
    let previousLoadedNavigation: INavigation;
    for (const history of this.navigations.history) {
      const isMatch = history.startCommandId >= sinceCommandId;
      const hasResponse =
        (history.statusChanges.has(LoadStatus.HttpResponded) ||
          history.statusChanges.has(LoadStatus.DomContentLoaded) ||
          history.statusChanges.has(LoadStatus.AllContentLoaded)) &&
        !history.statusChanges.has(LoadStatus.HttpRedirected);

      if (isMatch) {
        let isTriggered = false;
        if (trigger === LocationTrigger.reload) {
          isTriggered = FrameNavigationsObserver.isNavigationReload(history.navigationReason);
          if (
            !isTriggered &&
            !history.statusChanges.has(LoadStatus.HttpRedirected) &&
            previousLoadedNavigation &&
            previousLoadedNavigation.finalUrl === history.finalUrl
          ) {
            isTriggered = previousLoadedNavigation.loaderId !== history.loaderId;
          }
        }

        // if there was a previously loaded url, use this change
        if (
          trigger === LocationTrigger.change &&
          previousLoadedNavigation &&
          previousLoadedNavigation.finalUrl !== history.finalUrl &&
          hasResponse
        ) {
          // Don't accept adding a slash as a page change
          const isInPageUrlAdjust =
            history.navigationReason === 'inPage' &&
            history.finalUrl.replace(previousLoadedNavigation.finalUrl, '').length <= 1;

          if (!isInPageUrlAdjust) isTriggered = true;
        }

        if (isTriggered) {
          this.logger.info(`Resolving waitForLocation(${trigger}) with navigation history`, {
            historyEntry: history,
            status: trigger,
            sinceCommandId,
          });
          return history;
        }
      }

      if (hasResponse) {
        previousLoadedNavigation = history;
      }
    }
    return null;
  }

  private createStatusTriggeredPromise(
    status: LocationStatus,
    timeoutMs: number,
    startCommandId?: number,
  ): Promise<INavigation> {
    const existing = this.statusTriggers.find(
      x => x.status === status && x.startCommandId === startCommandId,
    );
    if (existing) {
      return existing.resolvable.promise;
    }

    const resolvable = new Resolvable<INavigation>(timeoutMs ?? 60e3);
    this.statusTriggers.push({
      status,
      startCommandId,
      resolvable,
    });

    return resolvable.promise;
  }

  private static isNavigationReload(reason: NavigationReason): boolean {
    return reason === 'httpHeaderRefresh' || reason === 'metaTagRefresh' || reason === 'reload';
  }
}
