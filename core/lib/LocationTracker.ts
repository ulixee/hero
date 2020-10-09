import { assert } from '@secret-agent/commons/utils';
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
import TabNavigations from '@secret-agent/session-state/lib/TabNavigations';

const READY = 'READY';

export default class LocationTracker {
  // this is the default "starting" point for a wait-for location change if a previous command id is not specified
  private defaultWaitForLocationCommandId = 0;
  private navigations: TabNavigations;

  private get currentStep() {
    const location = this.navigations.top;
    if (!location) return 0;

    return LocationTracker.getPipelineStatus(location);
  }

  private readonly waitForCbs: {
    [status in ILocationStatus]: (() => void)[];
  };

  constructor(navigations: TabNavigations) {
    this.waitForCbs = {
      reload: [],
      change: [],
      NavigationRequested: [],
      HttpRequested: [],
      HttpRedirected: [],
      HttpResponded: [],
      DomContentLoaded: [],
      AllContentLoaded: [],
    };
    this.navigations = navigations;
    navigations.on('navigation-requested', this.onNavigation.bind(this));
    navigations.on('status-change', this.onPipelineStatusChange.bind(this));
  }

  public willRunCommand(command: ICommandMeta, previousCommand: ICommandMeta) {
    const isPreviousCommandWait = previousCommand?.name.startsWith('waitFor') ?? false;
    // if this is a goto, reset the "waitForLocation(change/reload)" command marker
    const isGoto = command.name === 'goto';
    // if last command was a "click" and current command is "waitForLocation", we don't want to move
    // up the last command marker clear previous triggers
    // however, if the command is a waitForLocation, and the previous command was a waitFor*, we want to clear
    // previous triggers
    const isWaitAfterWait = command.name === 'waitForLocation' && isPreviousCommandWait;
    if (isWaitAfterWait || isGoto) {
      this.defaultWaitForLocationCommandId = command.id;
    }
  }

  public waitForLocationResourceId() {
    return this.navigations.top?.resourceId.promise;
  }

  public waitFor(
    status: ILocationStatus | 'READY',
    sinceCommandId?: number,
    inclusiveOfCommandId = true,
  ) {
    if (status === READY) {
      if (!this.navigations.top) return;
      status = LocationStatus.DomContentLoaded;
    }
    assert(LocationStatus[status], `Invalid navigation status: ${status}`);

    if (LocationTrigger[status]) {
      const hasPreviousTrigger = this.hasTriggerSinceCommand(
        LocationTrigger[status],
        sinceCommandId ?? this.defaultWaitForLocationCommandId,
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

    return new Promise<void>(async resolve => {
      this.waitForCbs[status].push(resolve);
    });
  }

  private onNavigation(lifecycle: INavigation) {
    // don't trigger change for the first url on a new tab
    if (lifecycle.navigationReason === 'newTab') return;
    const trigger = LocationTracker.getTriggerForNavigationReason(lifecycle.navigationReason);
    this.runWaitForCbs(trigger);
  }

  private onPipelineStatusChange(change: { newStatus: IPipelineStatus }) {
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

  private runWaitForCbs(status: ILocationStatus) {
    while (this.waitForCbs[status].length) {
      const resolve = this.waitForCbs[status].shift();
      resolve();
    }
  }

  private hasTriggerSinceCommand(
    trigger: LocationTrigger,
    sinceCommandId: number,
    inclusive: boolean,
  ) {
    for (const history of this.navigations.history) {
      let isMatch = history.startCommandId > sinceCommandId;
      if (inclusive) isMatch = isMatch || history.startCommandId === sinceCommandId;
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

  private static getPipelineStatus(page: INavigation): IPipelineStep {
    let maxStep: IPipelineStep = 0 as any;
    for (const status of page.stateChanges.keys()) {
      const step = LocationTracker.getStepByStatus(status);
      if (step > maxStep) maxStep = step;
    }
    return maxStep;
  }

  private static getTriggerForNavigationReason(reason: NavigationReason) {
    if (reason === 'newTab') return null;
    const isReload =
      reason === 'httpHeaderRefresh' || reason === 'metaTagRefresh' || reason === 'reload';
    return isReload ? LocationTrigger.reload : LocationTrigger.change;
  }
}
