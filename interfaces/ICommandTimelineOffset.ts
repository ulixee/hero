export default interface ICommandTimelineOffset {
  startTime: number;
  timelineOffsetStartMs: number;
  timelineOffsetEndMs: number;
  commandGapMs: number;
  runtimeMs: number;
}
