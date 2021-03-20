import { assert, createPromise } from '@secret-agent/commons/utils';
import type {
  ILocationStatus,
  ILocationTrigger,
  IPipelineStatus,
} from '@secret-agent/core-interfaces/Location';
import {
  LocationStatus,
  LocationTrigger,
  PipelineStatus,
} from '@secret-agent/core-interfaces/Location';
import INavigation, { NavigationReason } from '@secret-agent/core-interfaces/INavigation';
import type ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import type IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import type IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import * as moment from 'moment';
import type { IBoundLog } from '@secret-agent/core-interfaces/ILog';
import type FrameNavigations from './FrameNavigations';

export default class FrameNavigationsObserver {
  private readonly navigations: FrameNavigations;

  // this is the default "starting" point for a wait-for location change if a previous command id is not specified
  private defaultWaitForLocationCommandId = 0;

  private waitingForLoadTimeout: NodeJS.Timeout;
  private resourceIdResolvable: IResolvablePromise<number>;
  private statusTriggerResolvable: IResolvablePromise<void>;
  private statusTrigger: ILocationStatus;
  private logger: IBoundLog;

  constructor(navigations: FrameNavigations) {
    this.navigations = navigations;
    this.logger = navigations.logger.createChild(module);
    navigations.on('navigation-requested', this.onNavigation.bind(this));
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

  public waitForLocation(
    status: ILocationTrigger,
    options: IWaitForOptions = {},
    inclusiveOfCommandId = true,
  ): Promise<void> {
    assert(LocationTrigger[status], `Invalid location status: ${status}`);

    // determine if this location trigger has already been satisfied
    const sinceCommandId = options.sinceCommandId ?? this.defaultWaitForLocationCommandId;
    for (const history of this.navigations.history) {
      const isMatch = inclusiveOfCommandId
        ? history.startCommandId >= sinceCommandId
        : history.startCommandId > sinceCommandId;
      if (isMatch) {
        const previousState = FrameNavigationsObserver.getTriggerForNavigationReason(
          history.navigationReason,
        );
        if (previousState === status) {
          this.logger.info(`Resolving waitForLocation(${status}) with navigation history`, {
            history,
            status,
            sinceCommandId: options.sinceCommandId,
          });
          return Promise.resolve();
        }
      }
    }
    // otherwise set pending
    return this.createStatusTriggeredPromise(status, options.timeoutMs);
  }

  public waitForLoad(status: IPipelineStatus, options: IWaitForOptions = {}): Promise<void> {
    assert(PipelineStatus[status], `Invalid load status: ${status}`);

    if (options.sinceCommandId) {
      throw new Error('Not implemented');
    }

    const promise = this.createStatusTriggeredPromise(status, options.timeoutMs);

    if (this.navigations.top) this.onLoadStatusChange();
    return promise;
  }

  public waitForReady(): Promise<void> {
    if (!this.navigations.top) return Promise.resolve();
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

  public isPaintStable(): { isStable: boolean; timeUntilReadyMs?: number } {
    const top = this.navigations.top;
    if (!top) return { isStable: false };

    // need to wait for both load + painting stable, or wait 3 seconds after either
    const loadDate = top.stateChanges.get('Load');
    const contentPaintedDate = top.stateChanges.get('ContentPaint');
    if (!!loadDate && !!contentPaintedDate) return { isStable: true };

    // NOTE: LargestContentfulPaint, which currently drives PaintingStable will NOT trigger if the page
    // doesn't have any "contentful" items that are eligible (image, headers, divs, paragraphs that fill the page)

    // if not stable yet, don't count as resolved
    if (!contentPaintedDate) return { isStable: false };

    const timeUntilReadyMs = moment().diff(loadDate, 'milliseconds');
    return {
      isStable: timeUntilReadyMs >= 3e3,
      timeUntilReadyMs: Math.min(3e3, 3e3 - timeUntilReadyMs),
    };
  }

  private onNavigation(lifecycle: INavigation): void {
    // don't trigger change for the first url on a new tab
    if (lifecycle.navigationReason === 'newTab') return;
    const trigger = FrameNavigationsObserver.getTriggerForNavigationReason(
      lifecycle.navigationReason,
    );
    if (trigger === this.statusTrigger) this.resolvePendingStatus(trigger);
  }

  private onLoadStatusChange(): void {
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
      let recordedStatus = PipelineStatus[state as IPipelineStatus];

      // use painting stable "order of pipeline" if the passed in state is load
      if (state === 'Load') {
        recordedStatus = PipelineStatus.PaintingStable;
      }

      if (recordedStatus >= loadTrigger) {
        this.resolvePendingStatus(state as IPipelineStatus);
        return;
      }
    }
  }

  private waitForPageLoaded(): void {
    clearTimeout(this.waitingForLoadTimeout);

    const { isStable, timeUntilReadyMs } = this.isPaintStable();

    if (isStable) this.resolvePendingStatus('PaintingStable + Load');

    if (!isStable && timeUntilReadyMs) {
      const loadDate = this.navigations.top.stateChanges.get('Load');
      const contentPaintDate = this.navigations.top.stateChanges.get('ContentPaint');
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
    this.logger.info(`Resolving pending "${this.statusTrigger}" with trigger`, {
      resolvedWithStatus,
      waitingForStatus: this.statusTrigger,
      url: this.navigations.currentUrl,
    });
    clearTimeout(this.waitingForLoadTimeout);
    if (this.statusTriggerResolvable && !this.statusTriggerResolvable?.isResolved) {
      this.statusTriggerResolvable.resolve();
      this.statusTriggerResolvable = null;
    }
  }

  private createStatusTriggeredPromise(status: ILocationStatus, timeoutMs: number): Promise<void> {
    if (this.statusTriggerResolvable) this.cancelWaiting('New location trigger created');

    this.statusTrigger = status;
    this.statusTriggerResolvable = createPromise<void>(timeoutMs ?? 60e3);
    return this.statusTriggerResolvable.promise;
  }

  private static getTriggerForNavigationReason(reason: NavigationReason): LocationTrigger {
    if (reason === 'newTab') return null;
    const isReload =
      reason === 'httpHeaderRefresh' || reason === 'metaTagRefresh' || reason === 'reload';
    return isReload ? LocationTrigger.reload : LocationTrigger.change;
  }
}
