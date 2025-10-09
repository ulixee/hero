"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const INavigation_1 = require("@ulixee/unblocked-specification/agent/browser/INavigation");
const utils_1 = require("@ulixee/commons/lib/utils");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
class FrameNavigations extends eventUtils_1.TypedEventEmitter {
    get top() {
        return this.history.at(-1);
    }
    get currentUrl() {
        const top = this.top;
        if (!top)
            return '';
        return top.finalUrl ?? top.requestedUrl;
    }
    constructor(frame, logger) {
        super();
        this.frame = frame;
        this.history = [];
        this.historyByLoaderId = {};
        this.historyById = {};
        this.logger = logger.createChild(module);
        this.setEventsToLog(this.logger, ['navigation-requested', 'status-change']);
    }
    reset() {
        for (const entry of this.history) {
            delete this.historyByLoaderId[entry.loaderId];
            delete this.historyById[entry.id];
        }
        this.lastHttpNavigationRequest = null;
        this.initiatedUserAction = null;
        this.nextNavigationReason = null;
        this.history.length = 0;
    }
    get(id) {
        return this.historyById[id];
    }
    didGotoUrl(url) {
        return this.history.some(x => x.requestedUrl === url && x.navigationReason === 'goto');
    }
    hasLoadStatus(status) {
        if (!this.top)
            return false;
        const statuses = this.top.statusChanges;
        if (statuses.has(status)) {
            return true;
        }
        if (status === Location_1.LoadStatus.JavascriptReady) {
            return statuses.has(Location_1.LoadStatus.AllContentLoaded) || this.top.finalUrl === 'about:blank';
        }
        if (status === Location_1.LoadStatus.DomContentLoaded) {
            return statuses.has(Location_1.LoadStatus.DomContentLoaded) || statuses.has(Location_1.LoadStatus.AllContentLoaded);
        }
        if (status === Location_1.LoadStatus.PaintingStable) {
            return this.getPaintStableStatus().isStable;
        }
        return false;
    }
    getPaintStableStatus() {
        const top = this.top;
        if (!top)
            return { isStable: false };
        // need to wait for both load + painting stable, or wait 3 seconds after either one
        const loadDate = top.statusChanges.get(Location_1.LoadStatus.AllContentLoaded);
        const contentPaintedDate = top.statusChanges.get(INavigation_1.ContentPaint);
        if (contentPaintedDate)
            return { isStable: true };
        if (!loadDate && !contentPaintedDate)
            return { isStable: false };
        // NOTE: LargestContentfulPaint, which currently drives PaintingStable will NOT trigger if the page
        // doesn't have any "contentful" items that are eligible (image, headers, divs, paragraphs that fill the page)
        // have contentPaintedDate date, but no load
        const timeUntilReadyMs = Date.now() - (contentPaintedDate ?? loadDate);
        return {
            isStable: timeUntilReadyMs >= 3e3,
            timeUntilReadyMs: Math.min(3e3, 3e3 - timeUntilReadyMs),
        };
    }
    onNavigationRequested(reason, url, commandId, loaderId, browserRequestId) {
        let isNewTop = true;
        // if in page, make sure we're on the domain of the active url
        if (reason === 'inPage' && this.currentUrl) {
            isNewTop = isSameOrigin(url, this.currentUrl);
        }
        let nextTop;
        if (this.currentUrl === url && this.top.loaderId === 'NO_LOADER_ASSIGNED') {
            nextTop = this.top;
            nextTop.loaderId = loaderId;
            nextTop.browserRequestId = browserRequestId;
        }
        else {
            nextTop = {
                id: (this.frame.page.browserContext.idTracker.navigationId += 1),
                documentNavigationId: this.lastHttpNavigationRequest?.id,
                tabId: this.frame.page.tabId,
                requestedUrl: url,
                finalUrl: null,
                frameId: this.frame.frameId,
                loaderId,
                startCommandId: commandId,
                navigationReason: reason,
                initiatedTime: Date.now(),
                statusChanges: new Map(),
                resourceIdResolvable: (0, utils_1.createPromise)(),
                browserRequestId,
            };
            this.historyById[nextTop.id] = nextTop;
            if (isNewTop) {
                nextTop.resourceIdResolvable.promise
                    .then(this.resolveResourceId.bind(this, nextTop))
                    .catch(() => null);
                this.history.push(nextTop);
            }
            else {
                // insert at 1 before last
                const index = this.history.length - 1;
                this.history.splice(index, 0, nextTop);
            }
        }
        if (loaderId)
            this.historyByLoaderId[loaderId] = nextTop;
        this.checkStoredNavigationReason(nextTop, url);
        if (this.initiatedUserAction) {
            nextTop.navigationReason = this.initiatedUserAction.reason;
            nextTop.startCommandId = this.initiatedUserAction.startCommandId;
            this.initiatedUserAction = null;
        }
        let shouldPublishLocationChange = false;
        // if in-page, set the state to match current top
        if (reason === 'inPage') {
            if (this.top?.finalUrl === url)
                return;
            let lastHttpResponse = this.lastHttpNavigationRequest;
            if (!isNewTop) {
                lastHttpResponse = this.findMostRecentHistory(x => x.navigationReason === 'goto' &&
                    x.statusChanges.has(Location_1.LoadStatus.HttpResponded) &&
                    isSameOrigin(url, x.finalUrl ?? x.requestedUrl));
            }
            if (lastHttpResponse) {
                for (const state of lastHttpResponse.statusChanges.keys()) {
                    if (isPageLoadedStatus(state)) {
                        nextTop.statusChanges.set(state, Date.now());
                    }
                }
                nextTop.resourceIdResolvable.resolve(lastHttpResponse.resourceIdResolvable.promise);
            }
            else {
                nextTop.statusChanges.set(Location_1.LoadStatus.AllContentLoaded, nextTop.initiatedTime);
                nextTop.statusChanges.set(INavigation_1.ContentPaint, nextTop.initiatedTime);
                nextTop.resourceIdResolvable.resolve(-1);
            }
            shouldPublishLocationChange = isNewTop;
            nextTop.finalUrl = url;
        }
        else if (reason === 'goForwardOrBack') {
            nextTop.statusChanges.set(Location_1.LoadStatus.HttpRequested, nextTop.initiatedTime);
            nextTop.statusChanges.set(Location_1.LoadStatus.HttpResponded, nextTop.initiatedTime);
            nextTop.statusChanges.set(Location_1.LoadStatus.AllContentLoaded, nextTop.initiatedTime);
            nextTop.statusChanges.set(INavigation_1.ContentPaint, nextTop.initiatedTime);
            nextTop.resourceIdResolvable.resolve(-1);
        }
        else {
            let isStillSameHttpPage = false;
            if (nextTop.requestedUrl?.includes('#') && this.lastHttpNavigationRequest) {
                const baseUrl = (this.lastHttpNavigationRequest.finalUrl ?? this.lastHttpNavigationRequest.requestedUrl).split('#')[0];
                isStillSameHttpPage = nextTop.requestedUrl.startsWith(baseUrl);
            }
            if (!isStillSameHttpPage) {
                nextTop.documentNavigationId = null;
                this.lastHttpNavigationRequest = nextTop;
            }
        }
        if (isNewTop) {
            this.emit('navigation-requested', nextTop);
            this.emit('change', { navigation: nextTop });
        }
        if (shouldPublishLocationChange) {
            this.emit('status-change', {
                id: nextTop.id,
                newStatus: INavigation_1.ContentPaint,
                url,
                // @ts-ignore
                statusChanges: Object.fromEntries(nextTop.statusChanges),
            });
        }
        return nextTop;
    }
    onHttpRequested(url, lastCommandId, redirectedFromUrl, browserRequestId, loaderId) {
        // if this is a redirect, capture in top
        if (!this.top)
            return;
        let reason;
        if (redirectedFromUrl) {
            const redirectedNavigation = this.recordRedirect(redirectedFromUrl, url, loaderId);
            reason = redirectedNavigation?.navigationReason;
        }
        const top = this.top;
        const isHistoryNavigation = top.navigationReason === 'goBack' || top.navigationReason === 'goForward';
        if (!top.requestedUrl && isHistoryNavigation) {
            top.requestedUrl = url;
        }
        else if (!top.requestedUrl &&
            top.navigationReason === 'newFrame' &&
            top.loaderId === loaderId) {
            top.requestedUrl = url;
            this.checkStoredNavigationReason(top, url);
        }
        // if we already have this status at top level, this is a new nav
        else if (top.statusChanges.has(Location_1.LoadStatus.HttpRequested) &&
            // (top.statusChanges.size === 1 && top.statusChanges.has('ContentPaint'))) &&
            // add new entries for redirects
            (!this.historyByLoaderId[loaderId] || redirectedFromUrl)) {
            this.onNavigationRequested(reason, url, lastCommandId, loaderId, browserRequestId);
        }
        this.changeNavigationStatus(Location_1.LoadStatus.HttpRequested, loaderId);
    }
    onDomPaintEvent(event, url, timestamp, didRetry = false) {
        // only record the content paint
        if (event === 'LargestContentfulPaint') {
            this.onLoadStatusChanged(INavigation_1.ContentPaint, url, null, timestamp);
        }
        else if (event === 'FirstContentfulPaint') {
            const contentPaintHistory = this.findMostRecentHistory(x => x.finalUrl === url);
            if (contentPaintHistory?.statusChanges?.has(Location_1.LoadStatus.JavascriptReady)) {
                this.logger.warn('JavascriptReady received for navigation already ready', {
                    timestamp,
                    url,
                    contentPaintHistory,
                });
            }
            else if (contentPaintHistory) {
                this.setPageReady(contentPaintHistory, timestamp);
            }
            else if (!didRetry) {
                setTimeout(() => this.onDomPaintEvent(event, url, timestamp, true), 100);
            }
        }
    }
    adjustInPageLocationChangeTime(navigation, timestamp) {
        navigation.initiatedTime = timestamp;
        // if we already have dom content loaded, update to the new timestamp
        if (navigation.statusChanges.has(Location_1.LoadStatus.DomContentLoaded)) {
            navigation.statusChanges.set(Location_1.LoadStatus.DomContentLoaded, timestamp);
            navigation.statusChanges.set(Location_1.LoadStatus.AllContentLoaded, timestamp);
        }
    }
    setPageReady(navigation, timestamp) {
        this.recordStatusChange(navigation, Location_1.LoadStatus.JavascriptReady, timestamp);
    }
    onHttpResponded(browserRequestId, url, loaderId, responseTime) {
        const navigation = this.findMatchingNavigation(loaderId);
        if (!navigation) {
            return;
        }
        navigation.finalUrl = url;
        this.recordStatusChange(navigation, Location_1.LoadStatus.HttpResponded, responseTime);
    }
    pendingResourceId(browserRequestId, requestedUrl, finalUrl, loaderId) {
        const match = this.findMostRecentHistory(x => {
            if (x.resourceIdResolvable.isResolved)
                return false;
            if (loaderId && x.loaderId !== loaderId)
                return false;
            if (browserRequestId && x.browserRequestId && browserRequestId !== x.browserRequestId)
                return false;
            return true;
        });
        if (!match)
            return null;
        // hash won't be in the http request
        const frameRequestedUrl = match.requestedUrl?.split('#')?.shift();
        if ((match.finalUrl && finalUrl === match.finalUrl) || requestedUrl === frameRequestedUrl) {
            return match;
        }
        return null;
    }
    onResourceLoaded(navigation, resourceId, statusCode, error) {
        this.logger.info('NavigationResource resolved', {
            resourceId,
            statusCode,
            error,
            currentUrl: this.currentUrl,
        });
        if (!navigation || navigation.resourceIdResolvable.isResolved)
            return;
        // since we don't know if there are listeners yet, we need to just set the error on the return value
        // otherwise, get unhandledrejections
        if (error)
            navigation.navigationError = error;
        navigation.resourceIdResolvable.resolve(resourceId);
    }
    onLoadStatusChanged(incomingStatus, url, loaderId, statusChangeDate) {
        // if this is a painting stable, it won't come from a loader event for the page
        if (!loaderId) {
            loaderId = this.findMostRecentHistory(nav => (nav.finalUrl === url || nav.requestedUrl === url) &&
                nav.statusChanges.has(Location_1.LoadStatus.HttpResponded))?.loaderId;
        }
        this.changeNavigationStatus(incomingStatus, loaderId, statusChangeDate);
    }
    updateNavigationReason(url, reason) {
        const top = this.top;
        if (top &&
            top.requestedUrl === url &&
            (top.navigationReason === null || top.navigationReason === 'newFrame')) {
            top.navigationReason = reason;
            this.emit('change', { navigation: top });
        }
        else {
            this.nextNavigationReason = { url, reason };
        }
    }
    assignLoaderId(navigation, loaderId) {
        if (!loaderId) {
            navigation.loaderId = 'NO_LOADER_ASSIGNED';
            return;
        }
        this.historyByLoaderId[loaderId] ??= navigation;
        navigation.loaderId = loaderId;
        this.emit('change', { navigation });
    }
    getLastLoadedNavigation() {
        let navigation;
        let hasInPageNav = false;
        for (let i = this.history.length - 1; i >= 0; i -= 1) {
            navigation = this.history[i];
            if (navigation.navigationReason === 'inPage') {
                hasInPageNav = true;
                continue;
            }
            if (!navigation.finalUrl || !navigation.statusChanges.has(Location_1.LoadStatus.HttpResponded))
                continue;
            // if we have an in-page nav, return the first non "inPage" url. Otherwise, use if we loaded html
            if (hasInPageNav || navigation.statusChanges.has(Location_1.LoadStatus.DomContentLoaded)) {
                return navigation;
            }
        }
        return this.top;
    }
    findMostRecentHistory(callback) {
        for (let i = this.history.length - 1; i >= 0; i -= 1) {
            const navigation = this.history[i];
            if (callback(navigation))
                return navigation;
        }
    }
    checkStoredNavigationReason(navigation, url) {
        if (this.nextNavigationReason &&
            this.nextNavigationReason.url === url &&
            (!navigation.navigationReason || navigation.navigationReason === 'newFrame')) {
            navigation.navigationReason = this.nextNavigationReason.reason;
            this.nextNavigationReason = null;
        }
    }
    findMatchingNavigation(loaderId) {
        return this.historyByLoaderId[loaderId] ?? this.top;
    }
    recordRedirect(requestedUrl, finalUrl, loaderId) {
        const top = this.top;
        if (top.requestedUrl === requestedUrl && !top.finalUrl && !top.loaderId) {
            top.loaderId = loaderId;
            top.finalUrl = finalUrl;
            this.recordStatusChange(top, Location_1.LoadStatus.HttpRedirected);
            return top;
        }
        // find the right loader id
        const navigation = this.findMostRecentHistory(x => x.loaderId === loaderId &&
            !x.statusChanges.has(Location_1.LoadStatus.HttpRedirected) &&
            x.requestedUrl === requestedUrl);
        if (navigation) {
            navigation.finalUrl = finalUrl;
            this.recordStatusChange(navigation, Location_1.LoadStatus.HttpRedirected);
            return navigation;
        }
    }
    changeNavigationStatus(newStatus, loaderId, statusChangeDate) {
        const navigation = this.findMatchingNavigation(loaderId);
        if (!navigation)
            return;
        if (!navigation.loaderId && loaderId) {
            navigation.loaderId = loaderId;
            this.historyByLoaderId[loaderId] ??= navigation;
        }
        if (navigation.statusChanges.has(newStatus)) {
            if (statusChangeDate && statusChangeDate < navigation.statusChanges.get(newStatus)) {
                navigation.statusChanges.set(newStatus, statusChangeDate);
            }
            return;
        }
        this.recordStatusChange(navigation, newStatus, statusChangeDate);
    }
    resolveResourceId(navigation, resourceId) {
        navigation.resourceId = resourceId;
        this.emit('change', { navigation });
    }
    recordStatusChange(navigation, newStatus, statusChangeDate) {
        navigation.statusChanges.set(newStatus, statusChangeDate ?? Date.now());
        this.emit('status-change', {
            id: navigation.id,
            url: navigation.finalUrl ?? navigation.requestedUrl,
            // @ts-ignore - Typescript refuses to recognize this function
            statusChanges: Object.fromEntries(navigation.statusChanges),
            newStatus,
        });
        this.emit('change', { navigation });
    }
}
exports.default = FrameNavigations;
function isPageLoadedStatus(status) {
    return (status === INavigation_1.ContentPaint ||
        status === Location_1.LoadStatus.AllContentLoaded ||
        status === Location_1.LoadStatus.DomContentLoaded);
}
function isSameOrigin(url1, url2) {
    try {
        const parsed1 = new URL(url1);
        const parsed2 = new URL(url2);
        return parsed1.origin === parsed2.origin;
    }
    catch (err) {
        return false;
    }
}
//# sourceMappingURL=FrameNavigations.js.map