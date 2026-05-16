"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@ulixee/commons/lib/utils");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const INavigation_1 = require("@ulixee/unblocked-specification/agent/browser/INavigation");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
class FrameNavigationsObserver {
    constructor(navigations) {
        this.statusTriggers = [];
        this.navigations = navigations;
        this.logger = navigations.logger.createChild(module, { frameId: navigations.frame.frameId });
        navigations.on('status-change', this.onLoadStatusChange.bind(this));
    }
    waitForLocation(status, options = {}) {
        (0, utils_1.assert)(Location_1.LocationTrigger[status], `Invalid location status: ${status}`);
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
        if (trigger)
            return Promise.resolve(trigger);
        // otherwise set pending
        return this.createStatusTriggeredPromise(status, options.timeoutMs, sinceCommandId);
    }
    async waitForLoad(status, options = {}) {
        (0, utils_1.assert)(Location_1.LoadStatus[status], `Invalid load status: ${status}`);
        if (!this.navigations.top && this.navigations.frame.isDefaultUrl) {
            await this.navigations.frame.waitForDefaultLoader();
            if (status === Location_1.LoadStatus.JavascriptReady) {
                return;
            }
        }
        if (!options?.doNotIncrementMarker) {
            this.navigations.frame.page.browserContext.commandMarker.incrementMark?.('waitForLoad');
            this.logger.info(`Frame.waitForLoad(${status})`, options);
        }
        const top = this.navigations.top;
        if (top && top.statusChanges.has(status)) {
            this.logger.info(`Frame.waitForLoad:resolved(${status})`, {
                url: top.requestedUrl,
                loader: top.loaderId,
                status: Object.fromEntries(top.statusChanges),
            });
            return Promise.resolve(top);
        }
        const promise = this.createStatusTriggeredPromise(status, options.timeoutMs, options.sinceCommandId);
        if (top)
            this.onLoadStatusChange();
        return promise;
    }
    async waitForNavigationResourceId(navigation) {
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
    cancelWaiting(cancelMessage) {
        const statusPromises = [];
        for (const status of this.statusTriggers) {
            clearTimeout(status.waitingForLoadTimeout);
            statusPromises.push(status.resolvable);
        }
        this.statusTriggers.length = 0;
        for (const promise of [this.resourceIdResolvable, ...statusPromises]) {
            if (!promise || promise.isResolved)
                continue;
            const canceled = new IPendingWaitEvent_1.CanceledPromiseError(cancelMessage);
            canceled.stack += `\n${'------LOCATION'.padEnd(50, '-')}\n${promise.stack}`;
            promise.reject(canceled, true);
        }
    }
    onLoadStatusChange() {
        for (const trigger of [...this.statusTriggers]) {
            if (trigger.resolvable.isResolved)
                continue;
            if (trigger.status === Location_1.LocationTrigger.change || trigger.status === Location_1.LocationTrigger.reload) {
                const resolver = this.hasLocationTrigger(trigger.status, trigger.startCommandId);
                if (resolver) {
                    this.resolvePendingTrigger(trigger, trigger.status, resolver);
                }
            }
            else if (trigger.status === Location_1.LoadStatus.PaintingStable) {
                this.refreshPendingLoadTrigger(trigger);
            }
            else {
                const top = this.navigations.top;
                const resolution = this.getResolutionStatus(trigger);
                if (resolution !== null) {
                    this.resolvePendingTrigger(trigger, resolution, top);
                }
            }
        }
    }
    getResolutionStatus(trigger) {
        const desiredPipeline = Location_1.LoadStatusPipeline[trigger.status];
        // otherwise just look for state changes > the trigger
        const top = this.navigations.top;
        for (const statusChange of top.statusChanges.keys()) {
            // don't resolve states for redirected
            if (statusChange === Location_1.LoadStatus.HttpRedirected)
                continue;
            let pipelineStatus = Location_1.LoadStatusPipeline[statusChange];
            if (statusChange === Location_1.LoadStatus.AllContentLoaded) {
                pipelineStatus = Location_1.LoadStatusPipeline.AllContentLoaded;
            }
            if (pipelineStatus >= desiredPipeline) {
                return statusChange;
            }
        }
        return null;
    }
    refreshPendingLoadTrigger(trigger) {
        clearTimeout(trigger.waitingForLoadTimeout);
        const { isStable, timeUntilReadyMs } = this.navigations.getPaintStableStatus();
        if (isStable) {
            this.resolvePendingTrigger(trigger, 'PaintingStable + Load', this.navigations.top);
            return;
        }
        if (timeUntilReadyMs === undefined)
            return;
        trigger.waitingForLoadTimeout = setTimeout(() => {
            const top = this.navigations.top;
            const loadDate = top.statusChanges.get(Location_1.LoadStatus.AllContentLoaded);
            const contentPaintDate = top.statusChanges.get(INavigation_1.ContentPaint);
            this.resolvePendingTrigger(trigger, `TimeElapsed. Loaded="${loadDate}", ContentPaint="${contentPaintDate}"`, top);
        }, timeUntilReadyMs).unref();
    }
    resolvePendingTrigger(trigger, resolvedWithStatus, navigation) {
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
        if (index >= 0)
            this.statusTriggers.splice(index, 1);
    }
    hasLocationTrigger(trigger, sinceCommandId) {
        let previousLoadedNavigation;
        for (const history of this.navigations.history) {
            const isMatch = history.startCommandId >= sinceCommandId;
            const hasResponse = (history.statusChanges.has(Location_1.LoadStatus.HttpResponded) ||
                history.statusChanges.has(Location_1.LoadStatus.DomContentLoaded) ||
                history.statusChanges.has(Location_1.LoadStatus.AllContentLoaded)) &&
                !history.statusChanges.has(Location_1.LoadStatus.HttpRedirected);
            if (isMatch) {
                let isTriggered = false;
                if (trigger === Location_1.LocationTrigger.reload) {
                    isTriggered = FrameNavigationsObserver.isNavigationReload(history.navigationReason);
                    if (!isTriggered &&
                        !history.statusChanges.has(Location_1.LoadStatus.HttpRedirected) &&
                        previousLoadedNavigation &&
                        previousLoadedNavigation.finalUrl === history.finalUrl) {
                        isTriggered = previousLoadedNavigation.loaderId !== history.loaderId;
                    }
                }
                // if there was a previously loaded url, use this change
                if (trigger === Location_1.LocationTrigger.change &&
                    previousLoadedNavigation &&
                    previousLoadedNavigation.finalUrl !== history.finalUrl &&
                    hasResponse) {
                    // Don't accept adding a slash as a page change
                    const isInPageUrlAdjust = history.navigationReason === 'inPage' &&
                        history.finalUrl.replace(previousLoadedNavigation.finalUrl, '').length <= 1;
                    if (!isInPageUrlAdjust)
                        isTriggered = true;
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
    createStatusTriggeredPromise(status, timeoutMs, startCommandId) {
        const existing = this.statusTriggers.find(x => x.status === status && x.startCommandId === startCommandId);
        if (existing) {
            return existing.resolvable.promise;
        }
        const resolvable = new Resolvable_1.default(timeoutMs ?? 60e3, `Timeout waiting for navigation "${status}"`);
        this.statusTriggers.push({
            status,
            startCommandId,
            resolvable,
        });
        return resolvable.promise;
    }
    static isNavigationReload(reason) {
        return reason === 'httpHeaderRefresh' || reason === 'metaTagRefresh' || reason === 'reload';
    }
}
exports.default = FrameNavigationsObserver;
//# sourceMappingURL=FrameNavigationsObserver.js.map