"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hero_testing_1 = require("@ulixee/hero-testing");
const Location_1 = require("@ulixee/unblocked-specification/agent/browser/Location");
const CommandTimeline_1 = require("../lib/CommandTimeline");
afterAll(hero_testing_1.Helpers.afterAll);
afterEach(hero_testing_1.Helpers.afterEach);
test('should process commands into a timeline', async () => {
    const commands = [
        { id: 1, runStartDate: 500, endDate: 600 },
        { id: 2, runStartDate: 601, endDate: 610 },
    ];
    const navigations = [{ id: 1, url: '1', statusChanges: new Map() }];
    const commandTimeline = new CommandTimeline_1.default(commands, navigations);
    expect(commandTimeline.startTime).toBe(500);
    expect(commandTimeline.runtimeMs).toBe(110);
    expect(commandTimeline.commands).toHaveLength(2);
    expect(commandTimeline.commands[0].commandGapMs).toBe(0);
    expect(commandTimeline.commands[1].commandGapMs).toBe(1);
    expect(commandTimeline.commands[1].relativeStartMs).toBe(101);
});
test('should be able to calculate offsets', async () => {
    const commands = [
        { id: 1, runStartDate: 500, endDate: 600 },
        { id: 2, runStartDate: 601, endDate: 610 },
        { id: 3, runStartDate: 1500, endDate: 1510 },
    ];
    const navigations = [{ id: 1, url: '1', statusChanges: new Map() }];
    const commandTimeline = new CommandTimeline_1.default(commands, navigations);
    expect(commandTimeline.getTimelineOffsetForTimestamp(1500)).toBe(99);
    expect(commandTimeline.getTimelineOffsetForTimestamp(1510)).toBe(100);
});
test('should start by default at the first http request', async () => {
    const commands = [
        { id: 1, runStartDate: 500, endDate: 600 },
        { id: 2, runStartDate: 601, endDate: 610 },
    ];
    const navigations = [
        {
            id: 1,
            url: '1',
            statusChanges: new Map([
                [Location_1.LoadStatus.HttpRequested, 550],
                [Location_1.LoadStatus.DomContentLoaded, 555],
            ]),
        },
    ];
    const commandTimeline = new CommandTimeline_1.default(commands, navigations);
    // normal runtime
    expect(commandTimeline.runtimeMs).toBe(60);
    expect(commandTimeline.getTimelineOffsetForTimestamp(600)).toBe(83.3); // 50/60
});
test('should match percentages in and out', () => {
    const commands = [
        {
            clientStartDate: 1636664237736,
            runStartDate: 1636664237738,
            endDate: 1636664238135,
        },
        {
            clientStartDate: 1636664238140,
            runStartDate: 1636664238142,
            endDate: 1636664238146,
        },
        {
            runStartDate: 1636664238147,
            endDate: 1636664238396,
        },
        {
            runStartDate: 1636664238147,
            endDate: 1636664238147,
        },
        {
            clientStartDate: 1636664238398,
            runStartDate: 1636664238416,
            endDate: 1636664238417,
        },
        {
            clientStartDate: 1636664238399,
            runStartDate: 1636664238417,
            endDate: 1636664243193,
        },
    ].map((x, i) => {
        x.id = i + 1;
        x.run = 0;
        return x;
    });
    const timeline = new CommandTimeline_1.default(commands, []);
    const last = commands[commands.length - 1];
    expect(timeline.startTime).toBe(commands[0].clientStartDate);
    expect(timeline.endTime).toBe(last.endDate);
    expect(timeline.runtimeMs).toBe(last.endDate - commands[0].clientStartDate);
    for (const i of [0, 15, 14.7, 63, 78]) {
        const timestamp = timeline.getTimestampForOffset(i);
        const offset = timeline.getTimelineOffsetForTimestamp(timestamp);
        expect(offset).toBe(i);
    }
});
//# sourceMappingURL=commandTimeline.test.js.map