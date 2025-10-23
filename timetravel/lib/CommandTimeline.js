"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SourceMapSupport_1 = require("@ulixee/commons/lib/SourceMapSupport");
const INavigation_1 = require("@ulixee/unblocked-specification/agent/browser/INavigation");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
class CommandTimeline {
    constructor(commands, allNavigations) {
        this.runtimeMs = 0;
        this.commands = [];
        this.navigationsById = new Map();
        this.loadedNavigations = new Set();
        this.allNavigationsById = new Map();
        for (const navigation of allNavigations) {
            if (navigation.statusChanges.has(Location_1.LoadStatus.DomContentLoaded) &&
                (!this.firstCompletedNavigation ||
                    navigation.statusChanges.get(Location_1.LoadStatus.DomContentLoaded) <
                        this.firstCompletedNavigation.statusChanges.get(Location_1.LoadStatus.DomContentLoaded))) {
                this.firstCompletedNavigation = navigation;
            }
            if (navigation.statusChanges.has(Location_1.LoadStatus.DomContentLoaded) ||
                navigation.statusChanges.has(Location_1.LoadStatus.AllContentLoaded) ||
                navigation.statusChanges.has(INavigation_1.ContentPaint)) {
                this.loadedNavigations.add(navigation);
            }
            this.allNavigationsById.set(navigation.id, navigation);
        }
        const timelineStart = this.firstCompletedNavigation?.statusChanges.get(Location_1.LoadStatus.HttpRequested);
        let isClosed = false;
        for (let i = 0; i < commands.length; i += 1) {
            const command = { ...commands[i] };
            command.commandGapMs = 0;
            command.startTime = command.runStartDate;
            // client start date is never copied from a previous run, so you can end up with a newer date than the original run
            if (command.clientStartDate && command.clientStartDate < command.runStartDate) {
                command.startTime = command.clientStartDate;
            }
            let endDate = command.endDate;
            // if this is within 10 mins, assume it's still going
            if (!endDate && Date.now() - command.startTime < 10 * 60e3) {
                endDate = Date.now();
            }
            if (timelineStart) {
                // if command ends before timeline start, don't include it
                if (endDate < timelineStart)
                    continue;
                // if command runs within range of start, truncate to start
                if (command.startTime < timelineStart && endDate > timelineStart) {
                    command.startTime = timelineStart;
                }
            }
            const prev = this.commands[this.commands.length - 1];
            if (prev) {
                if (command.startTime < prev.endDate)
                    command.startTime = prev.endDate;
                // if this ended before previous ended, need to skip it (probably in parallel)
                if (endDate < prev.endDate) {
                    continue;
                }
                command.commandGapMs = Math.max(command.startTime - prev.endDate, 0);
            }
            // don't set a negative runtime
            command.runtimeMs = Math.max(endDate - command.startTime, 0);
            this.startTime ??= command.startTime;
            command.relativeStartMs = this.runtimeMs + command.commandGapMs;
            this.runtimeMs = command.relativeStartMs + command.runtimeMs;
            this.endTime = endDate;
            this.addNavigation(command.startNavigationId);
            this.addNavigation(command.endNavigationId);
            this.commands.push(command);
            if (command.name === 'close')
                isClosed = true;
            if (isClosed)
                break;
        }
    }
    getTimestampForOffset(percentOffset) {
        const millis = Math.round(100 * this.runtimeMs * (percentOffset / 100)) / 100;
        return this.startTime + millis;
    }
    getTimelineOffsetForTimestamp(timestamp) {
        if (!timestamp || timestamp > this.endTime)
            return -1;
        const runtimeMillis = timestamp - this.startTime;
        return this.getTimelineOffsetForRuntimeMillis(runtimeMillis);
    }
    toJSON() {
        return {
            startTime: this.startTime,
            endTime: this.endTime,
            runtimeMs: this.runtimeMs,
            commands: this.commands.map(x => {
                return {
                    id: x.id,
                    name: x.name,
                    startTime: x.startTime,
                    endTime: x.endDate,
                    relativeStartMs: x.relativeStartMs,
                    commandGapMs: x.commandGapMs,
                    runtimeMs: x.runtimeMs,
                    callsite: x.callsite.map(site => SourceMapSupport_1.SourceMapSupport.getOriginalSourcePosition(site)),
                };
            }),
        };
    }
    getTimelineOffsetForRuntimeMillis(timelineOffsetMs) {
        return roundFloor((100 * timelineOffsetMs) / this.runtimeMs);
    }
    addNavigation(id) {
        if (id !== undefined && id !== null && !this.navigationsById.has(id)) {
            const nav = this.allNavigationsById.get(id);
            if (nav)
                this.navigationsById.set(nav.id, nav);
        }
    }
    static fromSession(session) {
        return this.fromDb(session.db);
    }
    static fromDb(db) {
        return new CommandTimeline(db.commands.loadHistory(), db.frameNavigations.getAllNavigations());
    }
}
exports.default = CommandTimeline;
function roundFloor(num) {
    return Math.round(10 * num) / 10;
}
//# sourceMappingURL=CommandTimeline.js.map