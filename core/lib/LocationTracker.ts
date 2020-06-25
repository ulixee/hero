import { assert } from '@secret-agent/commons/utils';
import {
  ILocationStatus,
  IPipelineStatus,
  IPipelineStep,
  LocationStatus,
  LocationTrigger,
  PipelineStatus,
} from '@secret-agent/core-interfaces/Location';

import SessionState from '@secret-agent/shared-session-state';
import IPage, { NavigationReason } from '@secret-agent/core-interfaces/IPage';
import ICommandMeta from '@secret-agent/core-interfaces/ICommandMeta';

const READY = 'READY';

export default class LocationTracker {
  // this is the default "starting" point for a wait-for location change if a previous command id is not specified
  private defaultWaitForLocationCommandId = 0;

  private get currentPage() {
    return this.sessionState.pages.top;
  }

  private get currentTrigger() {
    const page = this.currentPage;
    if (!page) return;

    return LocationTracker.triggerForNavigationReason(page.navigationReason);
  }

  private get currentStep() {
    const page = this.currentPage;
    if (!page) return 0;

    return LocationTracker.getPipelineStatus(page);
  }

  private readonly waitForCbs: {
    [status in ILocationStatus]: (() => void)[];
  };

  constructor(readonly sessionState: SessionState) {
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
    sessionState.pages.onNewPage = this.onNewPage.bind(this);
    sessionState.pages.onPagePipelineStatusChange = this.onPagePipelineStatusChange.bind(this);
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
    return this.currentPage?.resourceId.promise;
  }

  public waitFor(
    status: ILocationStatus | 'READY',
    sinceCommandId?: number,
    inclusiveOfCommandId = true,
  ) {
    if (status === READY) {
      if (!this.currentTrigger) return;
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

  private onNewPage(page: IPage) {
    const trigger = LocationTracker.triggerForNavigationReason(page.navigationReason);
    this.runWaitForCbs(trigger);
  }

  private onPagePipelineStatusChange(_: IPage, newStatus: IPipelineStatus) {
    const incomingStep = LocationTracker.getStepByStatus(newStatus);
    const lastStep = this.currentStep ?? 0;
    const newStep = incomingStep > lastStep ? incomingStep : lastStep;
    const stepsToUpdate = newStep - lastStep;

    for (let i = 1; i <= stepsToUpdate; i += 1) {
      const step = (lastStep + i) as IPipelineStep;
      const status = LocationTracker.getStatusByStep(step);
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
    for (const history of this.sessionState.pages.history) {
      let isMatch = history.startCommandId > sinceCommandId;
      if (inclusive) isMatch = isMatch || history.startCommandId === sinceCommandId;
      if (isMatch) {
        const previousState = LocationTracker.triggerForNavigationReason(history.navigationReason);
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

  private static getStatusByStep(step: IPipelineStep): ILocationStatus {
    return Object.keys(PipelineStatus)[step] as IPipelineStatus;
  }

  private static getPipelineStatus(page: IPage): IPipelineStep {
    let maxStep: IPipelineStep = 0 as any;
    for (const status of page.stateChanges.keys()) {
      const step = LocationTracker.getStepByStatus(status);
      if (step > maxStep) maxStep = step;
    }
    return maxStep;
  }

  private static triggerForNavigationReason(reason: NavigationReason) {
    const isReload =
      reason === 'httpHeaderRefresh' || reason === 'metaTagRefresh' || reason === 'reload';
    return isReload ? LocationTrigger.reload : LocationTrigger.change;
  }
}
