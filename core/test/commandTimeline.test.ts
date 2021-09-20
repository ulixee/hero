import { Helpers } from '@ulixee/hero-testing';
import ICommandMeta from '@ulixee/hero-interfaces/ICommandMeta';
import INavigation from '@ulixee/hero-interfaces/INavigation';
import CommandTimeline from '../lib/CommandTimeline';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

test('should process commands into a timeline', async () => {
  const commands = [
    { id: 1, run: 0, runStartDate: 500, endDate: 600 } as ICommandMeta,
    { id: 2, run: 0, runStartDate: 601, endDate: 610 } as ICommandMeta,
  ] as ICommandMeta[];
  const navigations = [{ id: 1, url: '1' } as any] as INavigation[];
  const commandTimeline = new CommandTimeline(commands, 0, navigations);
  expect(commandTimeline.startTime).toBe(500);
  expect(commandTimeline.runtimeMs).toBe(110);
  expect(commandTimeline.commands).toHaveLength(2);
  expect(commandTimeline.commands[0].commandGapMs).toBe(0);
  expect(commandTimeline.commands[1].commandGapMs).toBe(1);
  expect(commandTimeline.commands[1].timelineOffsetEndMs).toBe(110);
});

test('should handle a second run', async () => {
  const commands = [
    { id: 1, run: 0, runStartDate: 500, endDate: 600 } as ICommandMeta,
    { id: 2, run: 0, runStartDate: 601, endDate: 610 } as ICommandMeta,
    { id: 1, run: 1, runStartDate: 500, endDate: 600, reusedCommandFromRun: 0 } as ICommandMeta,
    { id: 2, run: 1, runStartDate: 601, endDate: 610, reusedCommandFromRun: 0 } as ICommandMeta,
    { id: 3, run: 1, runStartDate: 1500, endDate: 1510 } as ICommandMeta,
  ] as ICommandMeta[];
  const navigations = [{ id: 1, url: '1' } as any] as INavigation[];

  const commandTimeline = new CommandTimeline(commands, 1, navigations);
  expect(commandTimeline.startTime).toBe(500);
  expect(commandTimeline.runtimeMs).toBe(120);
  expect(commandTimeline.commands).toHaveLength(3);
  expect(commandTimeline.commands[0].commandGapMs).toBe(0);
  expect(commandTimeline.commands[1].commandGapMs).toBe(1);
  expect(commandTimeline.commands[1].timelineOffsetEndMs).toBe(110);
  expect(commandTimeline.commands[2].timelineOffsetEndMs).toBe(120);
});

test('should be able to calculate offsets', async () => {
  const commands = [
    { id: 1, run: 0, runStartDate: 500, endDate: 600 } as ICommandMeta,
    { id: 2, run: 0, runStartDate: 601, endDate: 610 } as ICommandMeta,
    { id: 1, run: 1, runStartDate: 500, endDate: 600, reusedCommandFromRun: 0 } as ICommandMeta,
    { id: 2, run: 1, runStartDate: 601, endDate: 610, reusedCommandFromRun: 0 } as ICommandMeta,
    { id: 3, run: 1, runStartDate: 1500, endDate: 1510 } as ICommandMeta,
  ] as ICommandMeta[];
  const navigations = [{ id: 1, url: '1' } as any] as INavigation[];

  const commandTimeline = new CommandTimeline(commands, 1, navigations);
  expect(commandTimeline.getTimelineOffset(60)).toBe(50.0);
  // if timestamp is in the gap, we shouldn't include it
  expect(commandTimeline.getTimelineOffsetForTimestamp(1000)).toBe(-1);
  expect(commandTimeline.getTimelineOffsetForTimestamp(1500)).toBe(91.66);
  expect(commandTimeline.getTimelineOffsetForTimestamp(1510)).toBe(100);
});
