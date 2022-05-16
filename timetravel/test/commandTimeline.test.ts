import { Helpers } from '@ulixee/hero-testing';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import INavigation from '@unblocked-web/specifications/agent/browser/INavigation';
import { LoadStatus } from '@unblocked-web/specifications/agent/browser/Location';
import CommandTimeline from '../lib/CommandTimeline';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should process commands into a timeline', async () => {
  const commands = [
    { id: 1, runStartDate: 500, endDate: 600 } as ICommandMeta,
    { id: 2, runStartDate: 601, endDate: 610 } as ICommandMeta,
  ] as ICommandMeta[];
  const navigations = [{ id: 1, url: '1', statusChanges: new Map() } as any] as INavigation[];
  const commandTimeline = new CommandTimeline(commands, navigations);
  expect(commandTimeline.startTime).toBe(500);
  expect(commandTimeline.runtimeMs).toBe(110);
  expect(commandTimeline.commands).toHaveLength(2);
  expect(commandTimeline.commands[0].commandGapMs).toBe(0);
  expect(commandTimeline.commands[1].commandGapMs).toBe(1);
  expect(commandTimeline.commands[1].relativeStartMs).toBe(101);
});

test('should be able to calculate offsets', async () => {
  const commands = [
    { id: 1, runStartDate: 500, endDate: 600 } as ICommandMeta,
    { id: 2, runStartDate: 601, endDate: 610 } as ICommandMeta,
    { id: 3, runStartDate: 1500, endDate: 1510 } as ICommandMeta,
  ] as ICommandMeta[];
  const navigations = [{ id: 1, url: '1', statusChanges: new Map() } as any] as INavigation[];

  const commandTimeline = new CommandTimeline(commands, navigations);
  expect(commandTimeline.getTimelineOffsetForTimestamp(1500)).toBe(99);
  expect(commandTimeline.getTimelineOffsetForTimestamp(1510)).toBe(100);
});

test('should start by default at the first http request', async () => {
  const commands = [
    { id: 1, runStartDate: 500, endDate: 600 } as ICommandMeta,
    { id: 2, runStartDate: 601, endDate: 610 } as ICommandMeta,
  ] as ICommandMeta[];
  const navigations = [
    {
      id: 1,
      url: '1',
      statusChanges: new Map([
        [LoadStatus.HttpRequested, 550],
        [LoadStatus.DomContentLoaded, 555],
      ]),
    } as any,
  ] as INavigation[];

  const commandTimeline = new CommandTimeline(commands, navigations);
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
  ].map((x: any, i) => {
    x.id = i + 1;
    x.run = 0;
    return x;
  });
  const timeline = new CommandTimeline(commands as any, []);

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
