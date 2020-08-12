import ReplayState from '~backend/api/ReplayState';

export type IEventType = 'command' | 'paint' | 'focus' | 'mouse' | 'scroll' | 'page' | 'load';
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

  constructor(
    state: ReplayState,
    readonly eventType: IEventType,
    readonly eventTypeIdx: number,
    readonly commandId: number,
    readonly timestamp: string,
    readonly label?: string,
  ) {
    this.eventDate = new Date(timestamp);
    this.updateState(state);
  }

  public isMajor() {
    return this.eventType === 'command' || this.eventType === 'load';
  }

  public toJSON() {
    return {
      commandId: this.commandId,
      label: this.label,
      playbarOffsetPercent: this.playbarOffsetPercent,
    };
  }

  public updateState(state: ReplayState) {
    if (this.eventType === 'load') {
      this.playbarOffsetPercent = 0;
      return;
    }
    const startTime = state.startTime;
    const millis = this.eventDate.getTime() - startTime.getTime();
    this.playbarOffsetPercent = (100 * millis) / state.durationMillis;
  }
}
