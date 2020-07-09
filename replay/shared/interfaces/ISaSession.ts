import ICommandResult from './ICommandResult';

export default interface ISaSession {
  id: string;
  name: string;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  startDate: string;
  closeDate: string;
  scriptEntrypoint: string;
  scriptInstanceId: string;
  relatedScriptInstances: { id: string; startDate: string; defaultSessionId }[];
  ticks: ITick[];
  pages: { id: string; url: string }[];
  commandResults: ICommandResult[];
  relatedSessions: { id: string; name: string }[];
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
  paintEventIdx?: number;
  pageIdx?: number;
}
