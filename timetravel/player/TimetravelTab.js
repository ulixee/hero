"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventSubscriber_1 = require("@ulixee/commons/lib/EventSubscriber");
const eventUtils_1 = require("@ulixee/commons/lib/eventUtils");
class TimetravelTab extends eventUtils_1.TypedEventEmitter {
    get id() {
        return this.tabDetails.tabId;
    }
    get ticks() {
        return this.tabDetails.ticks;
    }
    get currentTick() {
        return this.ticks[this.currentTickIndex];
    }
    get nextTick() {
        return this.ticks[this.currentTickIndex + 1];
    }
    get previousTick() {
        return this.ticks[this.currentTickIndex - 1];
    }
    get focusedPaintIndexes() {
        if (!this.focusedTickRange) {
            return [this.currentTick?.paintEventIndex, this.currentTick?.paintEventIndex];
        }
        const [start, end] = this.focusedTickRange;
        const startTick = this.ticks[start];
        const endTick = this.ticks[end];
        return [startTick?.paintEventIndex ?? -1, endTick?.paintEventIndex ?? -1];
    }
    constructor(tabDetails, mirrorPage) {
        super();
        this.tabDetails = tabDetails;
        this.mirrorPage = mirrorPage;
        this.currentTimelineOffsetPct = 0;
        this.isPlaying = false;
        this.currentTickIndex = -1;
        this.events = new EventSubscriber_1.default();
        this.events.once(this.mirrorPage, 'close', () => {
            this.isPlaying = false;
            this.currentTickIndex = -1;
            this.currentTimelineOffsetPct = 0;
        });
    }
    updateTabDetails(tabDetails) {
        Object.assign(this.tabDetails, tabDetails);
        if (this.currentTickIndex >= 0) {
            this.currentTimelineOffsetPct =
                this.tabDetails.ticks[this.currentTickIndex]?.timelineOffsetPercent;
        }
    }
    async step(direction) {
        const tickIndex = this.currentTickIndex;
        if (direction === 'forward') {
            if (tickIndex === this.ticks.length - 1)
                return false;
            await this.loadTick(this.nextTick);
        }
        else {
            if (tickIndex === 0)
                return false;
            await this.loadTick(this.previousTick);
        }
        return true;
    }
    async play(onTick) {
        let pendingMillisDeficit = 0;
        this.isPlaying = true;
        for (let i = this.currentTickIndex; i < this.ticks.length; i += 1) {
            if (!this.isPlaying)
                break;
            if (i < 0)
                continue;
            const startTime = Date.now();
            await this.loadTick(i);
            onTick?.(this.ticks[i]);
            const fnDuration = Date.now() - startTime;
            if (i < this.ticks.length - 1) {
                const currentTick = this.ticks[i];
                const nextTick = this.ticks[i + 1];
                const diff = nextTick.timestamp - currentTick.timestamp;
                const delay = diff - fnDuration - pendingMillisDeficit;
                if (delay > 0)
                    await new Promise(resolve => setTimeout(resolve, delay));
                else if (delay < 0)
                    pendingMillisDeficit = Math.abs(delay);
            }
        }
        this.isPlaying = false;
        this.emitOffset();
    }
    pause() {
        this.isPlaying = false;
        this.emitOffset();
    }
    close() {
        this.events.close();
    }
    setFocusedOffsetRange(offsetRange) {
        if (!offsetRange) {
            this.focusedTickRange = null;
            this.focusedOffsetRange = null;
            return;
        }
        const [startPercent, endPercent] = offsetRange;
        this.focusedOffsetRange = offsetRange;
        this.focusedTickRange = [-1, -1];
        for (let i = 0; i < this.ticks.length; i += 1) {
            const offset = this.ticks[i].timelineOffsetPercent;
            if (offset < startPercent)
                continue;
            if (offset > endPercent)
                break;
            if (this.focusedTickRange[0] === -1) {
                this.focusedTickRange[0] = i;
            }
            this.focusedTickRange[1] = i;
        }
        if (this.focusedTickRange[1] === -1)
            this.focusedTickRange[1] = this.currentTickIndex;
    }
    findClosestTickIndex(timelineOffset) {
        const ticks = this.ticks;
        if (!ticks.length || this.currentTimelineOffsetPct === timelineOffset)
            return this.currentTickIndex;
        let newTickIdx = this.currentTickIndex;
        // if going forward, load next ticks
        if (timelineOffset > this.currentTimelineOffsetPct) {
            for (let i = newTickIdx; i < ticks.length; i += 1) {
                if (i < 0)
                    continue;
                if (ticks[i].timelineOffsetPercent > timelineOffset)
                    break;
                newTickIdx = i;
            }
        }
        else {
            for (let i = newTickIdx; i >= 0; i -= 1) {
                newTickIdx = i;
                if (ticks[i].timelineOffsetPercent <= timelineOffset)
                    break;
            }
        }
        return newTickIdx;
    }
    async setTimelineOffset(timelineOffset) {
        if (timelineOffset === undefined)
            return this.loadEndState();
        const newTickIdx = this.findClosestTickIndex(timelineOffset);
        if (this.currentTickIndex === newTickIdx)
            return;
        await this.loadTick(newTickIdx, timelineOffset);
    }
    async loadEndState() {
        await this.loadTick(this.ticks.length - 1);
    }
    async loadTickWithCommandId(commandId) {
        for (const tick of this.ticks) {
            if (tick.commandId === commandId) {
                await this.loadTick(tick);
            }
        }
    }
    async loadTick(newTickOrIdx, specificTimelineOffset) {
        if (newTickOrIdx === this.currentTickIndex || newTickOrIdx === this.currentTick) {
            return;
        }
        const mirrorPage = this.mirrorPage;
        let newTick = newTickOrIdx;
        let newTickIdx = newTickOrIdx;
        if (typeof newTickOrIdx === 'number') {
            newTick = this.ticks[newTickOrIdx];
        }
        else {
            newTickIdx = this.ticks.indexOf(newTick);
        }
        const startTick = this.currentTick;
        const startOffset = this.currentTimelineOffsetPct;
        this.currentTickIndex = newTickIdx;
        this.currentTimelineOffsetPct = specificTimelineOffset ?? newTick.timelineOffsetPercent;
        await mirrorPage.load(newTick.paintEventIndex);
        const mouseEvent = this.tabDetails.mouse[newTick.mouseEventIndex];
        const scrollEvent = this.tabDetails.scroll[newTick.scrollEventIndex];
        const nodesToHighlight = newTick.highlightNodeIds;
        if (nodesToHighlight || mouseEvent || scrollEvent) {
            await mirrorPage.showInteractions(nodesToHighlight, mouseEvent, scrollEvent);
        }
        if (newTick.commandId !== startTick?.commandId) {
            this.emit('new-tick-command', {
                commandId: newTick.commandId,
                paintIndex: newTick.paintEventIndex,
            });
        }
        if (newTick.paintEventIndex !== startTick?.paintEventIndex) {
            this.emit('new-paint-index', {
                paintIndexRange: this.focusedPaintIndexes,
                documentLoadPaintIndex: newTick.documentLoadPaintIndex,
            });
        }
        if (this.currentTimelineOffsetPct !== startOffset) {
            this.emitOffset();
        }
        await this.showLoadStatus();
    }
    async showLoadStatus() {
        const metadata = this.latestStatusMetadata;
        const timelineOffsetPercent = this.currentTimelineOffsetPct;
        if (!metadata || timelineOffsetPercent === 100)
            return;
        let currentUrl;
        let activeStatus;
        for (const url of metadata.urls) {
            if (url.offsetPercent > timelineOffsetPercent)
                break;
            currentUrl = url;
        }
        for (const status of currentUrl?.loadStatusOffsets ?? []) {
            if (status.offsetPercent > timelineOffsetPercent)
                break;
            activeStatus = status;
        }
        if (activeStatus) {
            await this.showStatusText(activeStatus.status);
        }
    }
    async showStatusText(text) {
        await this.mirrorPage.showStatusText(text);
    }
    getPaintEventAtIndex(index) {
        return this.tabDetails.domRecording.paintEvents[index];
    }
    emitOffset() {
        this.emit('new-offset', {
            playback: this.isPlaying ? 'automatic' : 'manual',
            url: this.mirrorPage.page?.mainFrame.url,
            percentOffset: this.currentTimelineOffsetPct,
            focusedRange: this.focusedOffsetRange,
        });
    }
}
exports.default = TimetravelTab;
//# sourceMappingURL=TimetravelTab.js.map