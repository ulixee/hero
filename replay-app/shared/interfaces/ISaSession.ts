export default interface ISaSession {
  id: string;
  name: string;
  tabs: ISessionTab[];
  dataLocation: string;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  startOrigin: string;
  startDate: Date;
  scriptStartDate: string;
  closeDate?: Date;
  scriptEntrypoint: string;
  scriptInstanceId: string;
  relatedScriptInstances: { id: string; startDate: string; defaultSessionId }[];
  relatedSessions: { id: string; name: string }[];
}

export interface ISessionTab {
  tabId: string;
  createdTime: string;
  startOrigin?: string;
}

export interface IMouseEvent {
  commandId: number;
  pageX: number;
  pageY: number;
  buttons: number;
  event: number;
  timestamp: string;
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
