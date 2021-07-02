export default interface ISaSession {
  id: string;
  name: string;
  tabs: ISessionTab[];
  dataLocation: string;
  screenWidth: number;
  screenHeight: number;
  deviceScaleFactor: number;
  startOrigin: string;
  startDate: Date;
  scriptStartDate: number;
  closeDate?: Date;
  scriptEntrypoint: string;
  scriptInstanceId: string;
  relatedScriptInstances: { id: string; startDate: number; defaultSessionId }[];
  relatedSessions: { id: string; name: string }[];
}

export interface ISessionTab {
  tabId: number;
  detachedFromTabId?: number;
  createdTime: number;
  startOrigin?: string;
  width: number;
  height: number;
}

export interface IMouseEvent {
  frameIdPath: string;
  commandId: number;
  pageX: number;
  pageY: number;
  offsetX: number;
  offsetY: number;
  buttons: number;
  targetNodeId: number;
  event: number;
  timestamp: number;
}

export interface IFrontendMouseEvent
  extends Omit<IMouseEvent, 'commandId' | 'timestamp' | 'event'> {
  viewportWidth: number;
  viewportHeight: number;
}

export interface IFocusRecord {
  frameIdPath: string;
  event: 0 | 1;
  commandId: number;
  targetNodeId?: number;
  relatedTargetNodeId?: number;
  timestamp: number;
}

export interface IScrollRecord {
  frameIdPath: string;
  scrollX: number;
  scrollY: number;
  commandId: number;
  timestamp: number;
}

export interface IOutputChange {
  type: 'insert' | 'delete' | 'update' | 'reorder';
  path: string;
  value: string;
  lastCommandId: number;
  timestamp: number;
}
