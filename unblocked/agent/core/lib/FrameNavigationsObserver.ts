import { assert } from '@ulixee/commons/lib/utils';
import {
  ILoadStatus,
  ILocationTrigger,
  LoadStatus,
  LoadStatusPipeline,
  LocationStatus,
  LocationTrigger,
} from '@unblocked-web/specifications/agent/browser/Location';
import { NavigationReason } from '@unblocked-web/specifications/agent/browser/NavigationReason';
import INavigation, {
  ContentPaint,
  NavigationStatus,
} from '@unblocked-web/specifications/agent/browser/INavigation';
import type IResolvablePromise from '@ulixee/commons/interfaces/IResolvablePromise';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import type { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Resolvable from '@ulixee/commons/lib/Resolvable';
import type FrameNavigations from './FrameNavigations';
import type IWaitForOptions from '../interfaces/IWaitForOptions';

interface IStatusTrigger {
  status: LocationStatus;
  resolvable: IResolvablePromise<INavigation>;
  startCommandId: number;
  waitingForLoadTimeout?: NodeJS.Timeout;
}

export default class FrameNavigationsObserver {
  // this is the default "starting" point for a wait-for location change if a previous command id is not specified
  private readonly navigations: FrameNavigations;

  private resourceIdResolvable: IResolvablePromise<number>;
  private logger: IBoundLog;
  private readonly statusTriggers: IStatusTrigger[] = [];

  constructor(navigations: FrameNavigations) {
    this.navigations = navigations;
    this.logger = navigations.logger.createChild(module);
    navigations.on('status-change', this.onLoadStatusChange.bind(this));
  }

  public waitForLocation(
    status: ILocationTrigger,
    options: IWaitForOptions = {},
  ): Promise<INavigation> {
    assert(LocationTrigger[status], `Invalid location status: ${status}`);
    const commandMarker = this.navigations.frame.page.browserContext.commandMarker;
    commandMarker.incrementMark?.('waitForLocation');

    // determine if this location trigger has already been satisfied
    const sinceCommandId = Number.isInteger(options.sinceCommandId)
      ? options.sinceCommandId
      : commandMarker.getStartingCommandIdFor('waitForLocation');

    const trigger = this.hasLocationTrigger(status, sinceCommandId);
    this.logger.info(`Frame.waitForLocation(${status})`, {
      sinceCommandId,
      preResolved: trigger?.requestedUrl ?? false,
    });
    if (trigger) return Promise.resolve(trigger);
    // otherwise set pending
    return this.createStatusTriggeredPromise(status, options.timeoutMs, sinceCommandId);
  }

  public async waitForLoad(
    status: ILoadStatus,
    options: IWaitForOptions & { doNotIncrementMarker?: boolean } = {},
  ): Promise<INavigation> {
    assert(LoadStatus[status], `Invalid load status: ${status}`);
    if (!this.navigations.top && this.navigations.frame.isDefaultUrl) {
      await this.navigations.frame.waitForDefaultLoader();
      if (status === LoadStatus.JavascriptReady) return;
    }

    if (!options?.doNotIncrementMarker) {
      this.navigations.frame.page.browserContext.commandMarker.incrementMark?.('waitForLoad');
      this.logger.info(`Frame.waitForLoad(${status})`, options);
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

  public async waitForNavigationResourceId(navigation?: INavigation): Promise<number> {
    const nav = navigation ?? this.navigations.top;

    this.logger.info(`Frame.waitForNavigationResourceId`, {
      url: nav?.finalUrl ?? nav?.requestedUrl,
    });
    this.resourceIdResolvable = nav?.resourceIdResolvable;
    const resourceId = await this.resourceIdResolvable?.promise;
    if (nav?.navigationError) {
      throw nav.navigationError;
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

    const resolvable = new Resolvable<INavigation>(
      timeoutMs ?? 60e3,
      `Timeout waiting for navigation "${status}"`,
    );
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
