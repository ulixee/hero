"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const INavigation_1 = require("@ulixee/unblocked-specification/agent/browser/INavigation");
const utils_1 = require("@ulixee/commons/lib/utils");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const Logger_1 = require("@ulixee/commons/lib/Logger");
const { log } = (0, Logger_1.default)(module);
class TimelineWatch extends eventUtils_1.TypedEventEmitter {
    constructor(heroSession, timelineExtenders) {
        super();
        this.heroSession = heroSession;
        this.timelineExtenders = timelineExtenders;
        this.events = new EventSubscriber_1.default();
        (0, utils_1.bindFunctions)(this);
        this.logger = log.createChild(module, { sessionId: heroSession.id });
        this.events.on(heroSession, 'tab-created', this.onTabCreated);
        this.events.on(heroSession, 'will-close', this.onHeroSessionWillClose);
        this.events.on(heroSession.commands, 'finish', this.onCommandFinish);
        this.events.on(heroSession, 'closed', this.close);
    }
    close() {
        if (!this.heroSession)
            return;
        this.events.off();
        this.closeTimer?.resolve();
    }
    onCommandFinish(command) {
        if (this.timelineExtenders.extendAfterCommands) {
            this.extendTimelineUntilTimestamp =
                command.endDate + this.timelineExtenders.extendAfterCommands;
        }
    }
    onHeroSessionWillClose(event) {
        if (!this.timelineExtenders)
            return;
        this.closeTimer?.resolve();
        let loadPromise;
        const { extendAfterLoadStatus } = this.timelineExtenders;
        if (extendAfterLoadStatus) {
            const { status, msAfterStatus } = extendAfterLoadStatus;
            const promises = [];
            for (const tab of this.heroSession.tabsById.values()) {
                if (!tab.navigations.hasLoadStatus(status)) {
                    this.logger.info('Delaying session close until page has load status.', {
                        status,
                        tabId: tab.id,
                    });
                    promises.push(tab.navigationsObserver
                        .waitForLoad(status)
                        .then(() => new Promise(resolve => setTimeout(resolve, msAfterStatus))));
                }
            }
            loadPromise = Promise.all(promises);
        }
        const delay = this.extendTimelineUntilTimestamp
            ? this.extendTimelineUntilTimestamp - Date.now()
            : 0;
        let delayPromise;
        if (delay > 0) {
            this.logger.info(`Delaying session close for ${delay}ms after last command.`);
            delayPromise = new Promise(resolve => setTimeout(resolve, delay));
        }
        if (loadPromise || delayPromise) {
            this.closeTimer = new Resolvable_1.default(60e3);
            const { resolve } = this.closeTimer;
            Promise.all([loadPromise, delayPromise]).then(resolve).catch(resolve);
            event.waitForPromise = this.closeTimer.promise;
        }
    }
    onTabCreated(event) {
        const tab = event.tab;
        const statusChangeEvent = this.events.on(tab.navigations, 'status-change', this.onStatusChange);
        this.events.once(tab, 'close', () => this.events.off(statusChangeEvent));
    }
    onStatusChange(status) {
        if ([
            Location_1.LoadStatus.DomContentLoaded,
            Location_1.LoadStatus.AllContentLoaded,
            INavigation_1.ContentPaint,
            Location_1.LoadStatus.JavascriptReady,
        ].includes(status.newStatus)) {
            this.emit('updated');
        }
    }
}
exports.default = TimelineWatch;
//# sourceMappingURL=TimelineWatch.js.map