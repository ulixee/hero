import ICommandResult from './ICommandResult';
import IPaintEvent from '~shared/interfaces/IPaintEvent';

export default interface ISaSession {
  id: string;
  name: string;
  unresponsiveSeconds: number;
  hasRecentErrors: boolean;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  startDate: string;
  closeDate: string;
  durationMillis: number;
  scriptEntrypoint: string;
  scriptInstanceId: string;
  relatedScriptInstances: { id: string; startDate: string; defaultSessionId }[];
  ticks: ITick[];
  pages: { id: string; url: string; commandId: number }[];
  paintEvents: IPaintEvent[];
  mouseEvents: IMouseEvent[];
  focusEvents: IFocusRecord[];
  scrollEvents: IScrollRecord[];
  commandResults: ICommandResult[];
  relatedSessions: { id: string; name: string }[];
}

export interface IMouseEvent {
  pageX: number;
  pageY: number;
  buttons: number;
  event: number;
}

export interface ITick {
  type: string;
  playbarOffsetPercent: number;
  commandId: number;
  label: string;
  timestamp: Date;
  minorTicks: IMinorTick[];
}

export interface IMinorTick {
  type: string;
  playbarOffsetPercent: number;
  timestamp: Date;
  mouseEventIdx?: number;
  paintEventIdx?: number;
  scrollEventIdx?: number;
  focusEventIdx?: number;
  pageIdx?: number;
}

export interface IFocusRecord {
  event: 0 | 1;
  commandId: number;
  targetNodeId?: number;
  relatedTargetNodeId?: number;
  timestamp: string;
}

export interface IScrollRecord {
  scrollX: number;
  scrollY: number;
  commandId: number;
  timestamp: string;
}
