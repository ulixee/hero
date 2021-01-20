import ReplayTabState from '~backend/api/ReplayTabState';
import ReplayTime from '~backend/api/ReplayTime';

export type IEventType = 'command' | 'paint' | 'focus' | 'mouse' | 'scroll' | 'page' | 'init';
export default class ReplayTick {
  public isNewDocumentTick = false;
  public documentOrigin: string;

  public documentLoadPaintIndex: number;

  public highlightNodeIds?: number[] = null;
  public paintEventIdx?: number = null;
  public scrollEventIdx?: number = null;
  public focusEventIdx?: number = null;
  public mouseEventIdx?: number = null;
  public get playbarOffsetPercent() {
    return this._playbarOffsetPercent;
  }

  public set playbarOffsetPercent(value) {
    this._playbarOffsetPercent = Math.floor(1000 * value) / 1000;
  }

  private _playbarOffsetPercent: number;
  private eventDate: Date;
  private lastDurationMillis: number;

  constructor(
    state: ReplayTabState,
    readonly eventType: IEventType,
    public eventTypeIdx: number,
    readonly commandId: number,
    readonly timestamp: string,
    readonly label?: string,
  ) {
    this.eventDate = new Date(timestamp);
    this.updateDuration(state.replayTime);
  }

  public isMajor() {
    return this.eventType === 'command' || this.eventType === 'init';
  }

  public toJSON() {
    return {
      commandId: this.commandId,
      label: this.label,
      playbarOffsetPercent: this.playbarOffsetPercent,
    };
  }

  public updateDuration(replayTime: ReplayTime) {
    if (this.eventType === 'init') {
      this.playbarOffsetPercent = 0;
      return;
    }

    if (replayTime.millis === this.lastDurationMillis) return;
    this.lastDurationMillis = replayTime.millis;

    const millis = this.eventDate.getTime() - replayTime.start.getTime();
    this.playbarOffsetPercent = (100 * millis) / replayTime.millis;
  }
}
