"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const TimetravelTab_1 = require("./TimetravelTab");
class TimetravelPlayer extends eventUtils_1.TypedEventEmitter {
    constructor(sessionDb, context) {
        super();
        this.sessionDb = sessionDb;
        this.context = context;
        this.shouldReloadTicks = false;
        this.tabsById = new Map();
        this.events = new EventSubscriber_1.default();
    }
    async loadTab(tabId) {
        await this.load();
        tabId ??= this.activeTabId ?? [...this.tabsById.keys()][0];
        if (tabId)
            this.activeTabId = tabId;
        return this.tabsById.get(tabId);
    }
    async close() {
        this.loadedPromise = null;
        this.events.close();
        for (const tab of this.tabsById.values()) {
            await tab.close();
        }
        this.activeTabId = null;
        this.tabsById.clear();
    }
    async setTabState(state) {
        this.loadedPromise ??= new Resolvable_1.default();
        for (const tabDetails of state) {
            const timetravelTab = this.tabsById.get(tabDetails.tabId);
            if (timetravelTab) {
                timetravelTab.updateTabDetails(tabDetails);
                continue;
            }
            const mirrorPage = await this.context.getMirrorPage(tabDetails.tabId);
            const tab = new TimetravelTab_1.default(tabDetails, mirrorPage);
            this.events.on(tab, 'new-offset', this.onNewOffset.bind(this, tabDetails.tabId));
            this.events.on(tab, 'new-paint-index', this.onNewPaintIndex.bind(this, tabDetails.tabId));
            this.events.on(tab, 'new-tick-command', this.onNewTickCommand.bind(this));
            this.tabsById.set(tabDetails.tabId, tab);
            this.activeTabId ??= tabDetails.tabId;
        }
        this.loadedPromise.resolve();
    }
    async load() {
        if (this.loadedPromise && !this.shouldReloadTicks)
            return this.loadedPromise;
        const state = this.context.loadTimelineTicks();
        this.shouldReloadTicks = false;
        await this.setTabState(state);
    }
    onNewOffset(tabId, event) {
        this.emit('new-offset', { ...event, tabId });
    }
    onNewTickCommand(event) {
        this.emit('new-tick-command', event);
    }
    onNewPaintIndex(tabId, event) {
        this.emit('new-paint-index', { ...event, tabId });
    }
}
exports.default = TimetravelPlayer;
//# sourceMappingURL=TimetravelPlayer.js.map