import { assert, createPromise } from '@secret-agent/commons/utils';
import type {
  ILocationStatus,
  ILocationTrigger,
  IPipelineStatus,
} from '@secret-agent/interfaces/Location';
import { LocationStatus, LocationTrigger, PipelineStatus } from '@secret-agent/interfaces/Location';
import { LoadStatus, NavigationReason } from '@secret-agent/interfaces/INavigation';
import type ICommandMeta from '@secret-agent/interfaces/ICommandMeta';
import type IWaitForOptions from '@secret-agent/interfaces/IWaitForOptions';
import type IResolvablePromise from '@secret-agent/interfaces/IResolvablePromise';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import * as moment from 'moment';
import type { IBoundLog } from '@secret-agent/interfaces/ILog';
import type FrameNavigations from './FrameNavigations';

export default class FrameNavigationsObserver {
  private readonly navigations: FrameNavigations;

  // this is the default "starting" point for a wait-for location change if a previous command id is not specified
  private defaultWaitForLocationCommandId = 0;

  private waitingForLoadTimeout: NodeJS.Timeout;
  private resourceIdResolvable: IResolvablePromise<number>;
  private statusTriggerResolvable: IResolvablePromise<void>;
  private statusTrigger: ILocationStatus;
  private statusTriggerStartCommandId: number;
  private logger: IBoundLog;

  constructor(navigations: FrameNavigations) {
    this.navigations = navigations;
    this.logger = navigations.logger.createChild(module);
    navigations.on('status-change', this.onLoadStatusChange.bind(this));
  }

  // this function will find the "starting command" to look for waitForLocation(change/reload)
  public willRunCommand(newCommand: ICommandMeta, previousCommands: ICommandMeta[]) {
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
    if (newCommand.name === 'waitForLocation' && last && last.name.startsWith('waitFor')) {
      this.defaultWaitForLocationCommandId = newCommand.id;
    }
  }

  public waitForLocation(status: ILocationTrigger, options: IWaitForOptions = {}): Promise<void> {
    assert(LocationTrigger[status], `Invalid location status: ${status}`);

    // determine if this location trigger has already been satisfied
    const sinceCommandId = Number(options.sinceCommandId ?? this.defaultWaitForLocationCommandId);
    if (this.hasLocationTrigger(status, sinceCommandId)) {
      return Promise.resolve();
    }
    // otherwise set pending
    return this.createStatusTriggeredPromise(status, options.timeoutMs, sinceCommandId);
  }

  public waitForLoad(status: IPipelineStatus, options: IWaitForOptions = {}): Promise<void> {
    assert(PipelineStatus[status], `Invalid load status: ${status}`);

    if (options.sinceCommandId) {
      throw new Error('Not implemented');
    }

    const top = this.navigations.top;
    if (top) {
      if (status === LocationStatus.DomContentLoaded) {
        if (
          top.stateChanges.has(LoadStatus.DomContentLoaded) ||
          top.stateChanges.has(LoadStatus.ContentPaint) ||
          top.stateChanges.has(LoadStatus.Load)
        ) {
          return;
        }
      } else if (status === LocationStatus.PaintingStable) {
        if (this.getPaintStableStatus().isStable) {
          return;
        }
      } else if (top.stateChanges.has(status as LoadStatus)) {
        return;
      }
    }
    const promise = this.createStatusTriggeredPromise(status, options.timeoutMs);

    if (top) this.onLoadStatusChange();
    return promise;
  }

  public waitForReady(): Promise<void> {
    return this.waitForLoad(LocationStatus.DomContentLoaded);
  }

  public async waitForNavigationResourceId(): Promise<number> {
    const top = this.navigations.top;

    this.resourceIdResolvable = top?.resourceId;
    const resourceId = await this.resourceIdResolvable?.promise;
    if (top?.navigationError) {
      throw top.navigationError;
    }
    return resourceId;
  }

  public cancelWaiting(cancelMessage: string): void {
    clearTimeout(this.waitingForLoadTimeout);
    for (const promise of [this.resourceIdResolvable, this.statusTriggerResolvable]) {
      if (!promise || promise.isResolved) continue;

      const canceled = new CanceledPromiseError(cancelMessage);
      canceled.stack += `\n${'------LOCATION'.padEnd(50, '-')}\n${promise.stack}`;
      promise.reject(canceled);
    }
  }

  public getPaintStableStatus(): { isStable: boolean; timeUntilReadyMs?: number } {
    const top = this.navigations.top;
    if (!top) return { isStable: false };

    // need to wait for both load + painting stable, or wait 3 seconds after either one
    const loadDate = top.stateChanges.get(LoadStatus.Load);
    const contentPaintedDate = top.stateChanges.get(LoadStatus.ContentPaint);

    if (contentPaintedDate) return { isStable: true };
    if (!loadDate && !contentPaintedDate) return { isStable: false };

    // NOTE: LargestContentfulPaint, which currently drives PaintingStable will NOT trigger if the page
    // doesn't have any "contentful" items that are eligible (image, headers, divs, paragraphs that fill the page)

    // have contentPaintedDate date, but no load
    const timeUntilReadyMs = moment().diff(contentPaintedDate ?? loadDate, 'milliseconds');
    return {
      isStable: timeUntilReadyMs >= 3e3,
      timeUntilReadyMs: Math.min(3e3, 3e3 - timeUntilReadyMs),
    };
  }

  private onLoadStatusChange(): void {
    if (
      this.statusTrigger === LocationTrigger.change ||
      this.statusTrigger === LocationTrigger.reload
    ) {
      if (this.hasLocationTrigger(this.statusTrigger, this.statusTriggerStartCommandId)) {
        this.resolvePendingStatus(this.statusTrigger);
      }
      return;
    }

    const loadTrigger = PipelineStatus[this.statusTrigger];
    if (!this.statusTriggerResolvable || this.statusTriggerResolvable.isResolved || !loadTrigger)
      return;

    if (this.statusTrigger === LocationStatus.PaintingStable) {
      this.waitForPageLoaded();
      return;
    }

    // otherwise just look for state changes > the trigger
    for (const state of this.navigations.top.stateChanges.keys()) {
      // don't resolve states for redirected
      if (state === LocationStatus.HttpRedirected) continue;
      let pipelineStatus = PipelineStatus[state as IPipelineStatus];
      if (state === LoadStatus.Load) {
        pipelineStatus = PipelineStatus.AllContentLoaded;
      }
      if (pipelineStatus >= loadTrigger) {
        this.resolvePendingStatus(state);
        return;
      }
    }
  }

  private waitForPageLoaded(): void {
    clearTimeout(this.waitingForLoadTimeout);

    const { isStable, timeUntilReadyMs } = this.getPaintStableStatus();

    if (isStable) this.resolvePendingStatus('PaintingStable + Load');

    if (!isStable && timeUntilReadyMs) {
      const loadDate = this.navigations.top.stateChanges.get(LoadStatus.Load);
      const contentPaintDate = this.navigations.top.stateChanges.get(LoadStatus.ContentPaint);
      this.waitingForLoadTimeout = setTimeout(
        () =>
          this.resolvePendingStatus(
            `TimeElapsed. Loaded="${loadDate}", ContentPaint="${contentPaintDate}"`,
          ),
        timeUntilReadyMs,
      ).unref();
    }
  }

  private resolvePendingStatus(resolvedWithStatus: string): void {
    if (this.statusTriggerResolvable && !this.statusTriggerResolvable?.isResolved) {
      this.logger.info(`Resolving pending "${this.statusTrigger}" with trigger`, {
        resolvedWithStatus,
        waitingForStatus: this.statusTrigger,
        url: this.navigations.currentUrl,
      });
      clearTimeout(this.waitingForLoadTimeout);
      this.statusTriggerResolvable.resolve();
      this.statusTriggerResolvable = null;
      this.statusTrigger = null;
      this.statusTriggerStartCommandId = null;
    }
  }

  private hasLocationTrigger(trigger: ILocationTrigger, sinceCommandId: number) {
    let previousLoadedUrl: string;
    for (const history of this.navigations.history) {
      const isMatch = history.startCommandId >= sinceCommandId;
      if (isMatch) {
        let isLocationChange = false;
        if (trigger === LocationTrigger.reload) {
          isLocationChange = FrameNavigationsObserver.isNavigationReload(history.navigationReason);
        }

        // if there was a previously loaded url, use this change
        if (
          trigger === LocationTrigger.change &&
          previousLoadedUrl &&
          previousLoadedUrl !== history.finalUrl
        ) {
          isLocationChange = true;
        }

        if (isLocationChange) {
          this.logger.info(`Resolving waitForLocation(${trigger}) with navigation history`, {
            historyEntry: history,
            status: trigger,
            sinceCommandId,
          });
          return true;
        }
      }

      if (
        history.stateChanges.has(LoadStatus.HttpResponded) &&
        !history.stateChanges.has(LoadStatus.HttpRedirected)
      ) {
        previousLoadedUrl = history.finalUrl;
      }
    }
    return false;
  }

  private createStatusTriggeredPromise(
    status: ILocationStatus,
    timeoutMs: number,
    sinceCommandId?: number,
  ): Promise<void> {
    if (this.statusTriggerResolvable) this.cancelWaiting('New location trigger created');

    this.statusTrigger = status;
    this.statusTriggerStartCommandId = sinceCommandId;
    this.statusTriggerResolvable = createPromise<void>(timeoutMs ?? 60e3);
    return this.statusTriggerResolvable.promise;
  }

  private static isNavigationReload(reason: NavigationReason): boolean {
    return reason === 'httpHeaderRefresh' || reason === 'metaTagRefresh' || reason === 'reload';
  }
}
