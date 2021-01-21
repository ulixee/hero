import { assert, createPromise } from '@secret-agent/commons/utils';
import {
  ILocationStatus,
  IPipelineStatus,
  IPipelineStep,
  LocationStatus,
  LocationTrigger,
  PipelineStatus,
} from '@secret-agent/core-interfaces/Location';
import INavigation, { NavigationReason } from '@secret-agent/core-interfaces/INavigation';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';
import IWaitForOptions from '@secret-agent/core-interfaces/IWaitForOptions';
import IResolvablePromise from '@secret-agent/core-interfaces/IResolvablePromise';
import { CanceledPromiseError } from '@secret-agent/commons/interfaces/IPendingWaitEvent';
import TabNavigations from './TabNavigations';

const READY = 'READY';

export default class LocationTracker {
  public get currentPipelineStatus(): IPipelineStatus {
    let maxStep = 0;
    let status: IPipelineStatus = 'HttpRequested';
    for (const stateChange of this.navigations.top.stateChanges.keys()) {
      const step = LocationTracker.getStepByStatus(stateChange);
      if (step > maxStep) {
        maxStep = step;
        status = stateChange;
      }
    }
    return status;
  }

  // this is the default "starting" point for a wait-for location change if a previous command id is not specified
  private defaultWaitForLocationCommandId = 0;
  private navigations: TabNavigations;

  private get currentStep(): IPipelineStep {
    const location = this.navigations.top;
    if (!location) return 0;

    return LocationTracker.getPipelineStep(location);
  }

  private readonly waitForCbs: {
    [status in ILocationStatus]: IResolvablePromise<void>[];
  };

  constructor(navigations: TabNavigations) {
    this.waitForCbs = {} as any;
    for (const key in LocationStatus) {
      if (LocationStatus[key]) this.waitForCbs[key] = [];
    }
    this.navigations = navigations;
    navigations.on('navigation-requested', this.onNavigation.bind(this));
    navigations.on('status-change', this.onPipelineStatusChange.bind(this));
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
    if (newCommand.name === 'waitForLocation' && last && last.name.startsWith('waitFor')) {
      this.defaultWaitForLocationCommandId = newCommand.id;
    }
  }

  public async waitForLocationResourceId(): Promise<number> {
    const resourceId = await this.navigations.top?.resourceId?.promise;
    if (this.navigations.top?.navigationError) {
      throw this.navigations.top.navigationError;
    }
    return resourceId;
  }

  public waitFor(
    status: ILocationStatus | 'READY',
    options: IWaitForOptions = {},
    inclusiveOfCommandId = true,
  ): Promise<void> {
    if (status === READY) {
      if (!this.navigations.top) return;
      status = LocationStatus.DomContentLoaded;
    }
    assert(LocationStatus[status], `Invalid navigation status: ${status}`);

    if (LocationTrigger[status]) {
      const hasPreviousTrigger = this.hasTriggerSinceCommand(
        LocationTrigger[status],
        options.sinceCommandId ?? this.defaultWaitForLocationCommandId,
        inclusiveOfCommandId,
      );
      if (hasPreviousTrigger) {
        return;
      }
    }
    if (PipelineStatus[status]) {
      const step = LocationTracker.getStepByStatus(status as IPipelineStatus);
      if (step && step <= this.currentStep) {
        return;
      }
    }

    const resolvablePromise = createPromise<void>(options.timeoutMs);
    this.waitForCbs[status].push(resolvablePromise);
    return resolvablePromise.promise;
  }

  public cancelWaiting(cancelMessage: string): void {
    for (const waitingForStatus of Object.values(this.waitForCbs)) {
      while (waitingForStatus.length) {
        const resolvable = waitingForStatus.shift();
        const canceled = new CanceledPromiseError(cancelMessage);
        canceled.stack += `\n${'------LOCATION'.padEnd(50, '-')}\n${resolvable.stack}`;
        resolvable.reject(canceled);
      }
    }
  }

  private onNavigation(lifecycle: INavigation): void {
    // don't trigger change for the first url on a new tab
    if (lifecycle.navigationReason === 'newTab') return;
    const trigger = LocationTracker.getTriggerForNavigationReason(lifecycle.navigationReason);
    this.runWaitForCbs(trigger);
  }

  private onPipelineStatusChange(change: { newStatus: IPipelineStatus }): void {
    const incomingStep = LocationTracker.getStepByStatus(change.newStatus);
    const lastStep = this.currentStep ?? 0;
    const newStep = incomingStep > lastStep ? incomingStep : lastStep;
    const stepsToUpdate = newStep - lastStep;

    const pipelineKeys = Object.keys(PipelineStatus);
    for (let i = 1; i <= stepsToUpdate; i += 1) {
      const step = (lastStep + i) as IPipelineStep;
      const status = pipelineKeys[step] as IPipelineStatus;
      if (status !== LocationStatus.HttpRedirected || step === newStep) {
        this.runWaitForCbs(status);
      }
    }
  }

  private runWaitForCbs(status: ILocationStatus): void {
    while (this.waitForCbs[status].length) {
      const resolvablePromise = this.waitForCbs[status].shift();
      resolvablePromise.resolve();
    }
  }

  private hasTriggerSinceCommand(
    trigger: LocationTrigger,
    sinceCommandId: number,
    inclusive: boolean,
  ): boolean {
    for (const history of this.navigations.history) {
      let isMatch = history.startCommandId > sinceCommandId;
      if (inclusive) isMatch = isMatch || history.startCommandId >= sinceCommandId;
      if (isMatch) {
        const previousState = LocationTracker.getTriggerForNavigationReason(
          history.navigationReason,
        );
        if (previousState === trigger) {
          return true;
        }
      }
    }
    return false;
  }

  private static getStepByStatus(status: IPipelineStatus): IPipelineStep {
    return Number(PipelineStatus[status]) as IPipelineStep;
  }

  private static getPipelineStep(page: INavigation): IPipelineStep {
    let maxStep: IPipelineStep = 0 as any;
    for (const status of page.stateChanges.keys()) {
      const step = LocationTracker.getStepByStatus(status);
      if (step > maxStep) maxStep = step;
    }
    return maxStep;
  }

  private static getTriggerForNavigationReason(reason: NavigationReason): LocationTrigger {
    if (reason === 'newTab') return null;
    const isReload =
      reason === 'httpHeaderRefresh' || reason === 'metaTagRefresh' || reason === 'reload';
    return isReload ? LocationTrigger.reload : LocationTrigger.change;
  }
}
