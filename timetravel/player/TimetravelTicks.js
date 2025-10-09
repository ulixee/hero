"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MouseEventsTable_1 = require("@ulixee/hero-core/models/MouseEventsTable");
const CommandFormatter_1 = require("@ulixee/hero-core/lib/CommandFormatter");
const DomChangesTable_1 = require("@ulixee/hero-core/models/DomChangesTable");
const CommandTimeline_1 = require("../lib/CommandTimeline");
class TimetravelTicks {
    get tabs() {
        return Object.values(this.tabsById);
    }
    constructor(sessionDb, timelineRange) {
        this.sessionDb = sessionDb;
        this.timelineRange = timelineRange;
        this.tabsById = {};
    }
    load(domRecordingsWithTabId, commandTimeline) {
        this.timeline = commandTimeline ?? CommandTimeline_1.default.fromDb(this.sessionDb);
        domRecordingsWithTabId ??= TimetravelTicks.loadDomRecording(this.sessionDb);
        for (const { tabId, domRecording } of domRecordingsWithTabId) {
            this.tabsById[tabId] = {
                domRecording,
                tabId,
                ticks: [],
                mouse: [],
                focus: [],
                scroll: [],
            };
        }
        if (!domRecordingsWithTabId.length) {
            this.tabsById[1] = {
                domRecording: {
                    documents: [],
                    paintEvents: [],
                    mainFrameIds: new Set(),
                    domNodePathByFrameId: {},
                },
                tabId: 1,
                ticks: [],
                mouse: [],
                focus: [],
                scroll: [],
            };
        }
        this.createCommandTicks();
        this.createInteractionTicks();
        this.createPaintTicks();
        // now sort all ticks and assign events
        this.sortTicks();
        return this.tabs;
    }
    createCommandTicks() {
        const commands = this.timeline.commands;
        for (let i = 0; i < commands.length; i += 1) {
            const command = commands[i];
            const tabId = command.tabId ?? this.tabs[0]?.tabId;
            this.addTick('command', i, {
                timestamp: command.startTime,
                commandId: command.id,
                label: CommandFormatter_1.default.toString(command),
                tabId,
            });
        }
    }
    createInteractionTicks() {
        const filteredMouseEvents = new Set([
            MouseEventsTable_1.MouseEventType.MOVE,
            MouseEventsTable_1.MouseEventType.DOWN,
            MouseEventsTable_1.MouseEventType.UP,
        ]);
        const interactions = {
            mouse: this.sessionDb.mouseEvents
                .all()
                .filter(x => filteredMouseEvents.has(x.event))
                .sort(sortByTimestamp),
            focus: this.sessionDb.focusEvents.all().sort(sortByTimestamp),
            scroll: this.sessionDb.scrollEvents.all().sort(sortByTimestamp),
        };
        for (const [type, events] of Object.entries(interactions)) {
            for (let i = 0; i < events.length; i += 1) {
                const event = events[i];
                this.addTick(type, i, event);
                const tabEvents = this.tabsById[event.tabId][type];
                tabEvents.push(event);
            }
        }
    }
    createPaintTicks() {
        for (const { tabId, domRecording } of this.tabs) {
            if (!domRecording)
                continue;
            const newDocumentUrlByPaintIndex = {};
            for (const document of domRecording.documents) {
                newDocumentUrlByPaintIndex[document.paintEventIndex] = document.url;
            }
            let idx = 0;
            for (const event of domRecording.paintEvents) {
                const tick = this.addTick('paint', idx, { tabId, ...event });
                const newDocumentUrl = newDocumentUrlByPaintIndex[idx];
                if (newDocumentUrl) {
                    tick.isNewDocumentTick = true;
                    tick.documentUrl = newDocumentUrl;
                }
                idx += 1;
            }
        }
    }
    sortTicks() {
        for (const tab of this.tabs) {
            const { focus, mouse, domRecording, ticks } = tab;
            if (!domRecording) {
                delete this.tabsById[tab.tabId];
                continue;
            }
            const firstDocument = domRecording.documents[0];
            if (!firstDocument)
                continue;
            let lastEvents = {
                documentLoadPaintIndex: firstDocument.paintEventIndex,
                documentUrl: firstDocument.url,
            };
            const commandHighlightsById = new Map();
            for (const command of this.timeline.commands) {
                const result = CommandFormatter_1.default.parseResult(command);
                if (result.resultNodeIds) {
                    commandHighlightsById.set(command.id, result);
                }
            }
            ticks.sort((a, b) => {
                if (a.timestamp === b.timestamp) {
                    if (a.eventType === b.eventType)
                        return a.eventTypeIndex - b.eventTypeIndex;
                    return a.eventType.localeCompare(b.eventType);
                }
                return a.timestamp - b.timestamp;
            });
            for (const tick of ticks) {
                // if new doc, reset the markers
                if (tick.isNewDocumentTick) {
                    lastEvents = {
                        paintEventIndex: tick.eventTypeIndex,
                        scrollEventIndex: undefined,
                        mouseEventIndex: undefined,
                        focusEventIndex: undefined,
                        documentLoadPaintIndex: tick.eventTypeIndex,
                        documentUrl: tick.documentUrl,
                        highlightNodeIds: undefined,
                    };
                }
                switch (tick.eventType) {
                    case 'command':
                        const command = commandHighlightsById.get(tick.commandId);
                        if (command) {
                            lastEvents.highlightNodeIds = {
                                nodeIds: command.resultNodeIds,
                                frameId: command.frameId,
                            };
                        }
                        break;
                    case 'focus':
                        lastEvents.focusEventIndex = tick.eventTypeIndex;
                        const focusEvent = focus[tick.eventTypeIndex];
                        if (focusEvent.event === 0 && focusEvent.targetNodeId) {
                            lastEvents.highlightNodeIds = {
                                nodeIds: [focusEvent.targetNodeId],
                                frameId: focusEvent.frameId,
                            };
                        }
                        else if (focusEvent.event === 1) {
                            lastEvents.highlightNodeIds = undefined;
                        }
                        break;
                    case 'paint':
                        lastEvents.paintEventIndex = tick.eventTypeIndex;
                        break;
                    case 'scroll':
                        lastEvents.scrollEventIndex = tick.eventTypeIndex;
                        break;
                    case 'mouse':
                        lastEvents.mouseEventIndex = tick.eventTypeIndex;
                        const mouseEvent = mouse[tick.eventTypeIndex];
                        if (mouseEvent.event === 1 && mouseEvent.targetNodeId) {
                            lastEvents.highlightNodeIds = {
                                nodeIds: [mouseEvent.targetNodeId],
                                frameId: mouseEvent.frameId,
                            };
                        }
                        else if (mouseEvent.event === 2) {
                            lastEvents.highlightNodeIds = undefined;
                        }
                        break;
                }
                Object.assign(tick, lastEvents);
                if (tick.eventType === 'init' || lastEvents.paintEventIndex === undefined) {
                    tick.documentLoadPaintIndex = -1;
                    tick.documentUrl = firstDocument.url;
                    tick.paintEventIndex = -1;
                }
            }
            // filter afterwards so we get correct navigations
            tab.ticks = ticks.filter(tick => {
                tick.timelineOffsetPercent ??= this.timeline.getTimelineOffsetForTimestamp(tick.timestamp);
                return tick.timelineOffsetPercent <= 100 && tick.timelineOffsetPercent >= 0;
            });
        }
    }
    addTick(eventType, eventTypeIndex, tick) {
        const { commandId, timestamp, label, tabId } = tick;
        const newTick = {
            eventType,
            eventTypeIndex,
            commandId,
            timestamp,
            label,
            isMajor: eventType === 'command',
        };
        const tabDetails = tabId ? this.tabsById[tabId] : Object.values(this.tabsById)[0];
        tabDetails.ticks.push(newTick);
        return newTick;
    }
    static loadDomRecording(sessionDb) {
        const allDomChanges = sessionDb.domChanges.all();
        const domChangesByTabId = {};
        for (const change of allDomChanges) {
            domChangesByTabId[change.tabId] ??= [];
            domChangesByTabId[change.tabId].push(change);
        }
        return Object.entries(domChangesByTabId).map(([tabIdString, changes]) => {
            const tabId = Number(tabIdString);
            const domRecording = DomChangesTable_1.default.toDomRecording(changes, sessionDb.frames.mainFrameIds(tabId), sessionDb.frames.frameDomNodePathsById);
            return { tabId, domRecording };
        });
    }
}
exports.default = TimetravelTicks;
function sortByTimestamp(a, b) {
    return a.timestamp - b.timestamp;
}
//# sourceMappingURL=TimetravelTicks.js.map