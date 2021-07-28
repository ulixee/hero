import SessionDb from '../dbs/SessionDb';
import { GlobalPool } from '../index';
import { IMouseEventRecord, MouseEventType } from '../models/MouseEventsTable';
import { IFocusRecord } from '../models/FocusEventsTable';
import { IScrollRecord } from '../models/ScrollEventsTable';
import ICoreApi from '../interfaces/ICoreApi';

export default function sessionInteractionsApi(
  args: ISessionInteractionsArgs,
): ISessionInteractionsResult {
  const sessionDb = SessionDb.getCached(
    args.sessionId,
    args.dataLocation ?? GlobalPool.sessionsDir,
    true,
  );

  function sort(a: { timestamp: number }, b: { timestamp: number }) {
    return a.timestamp - b.timestamp;
  }

  const validMouseEvents = args.mouseEventsFilter ?? [
    MouseEventType.MOVE,
    MouseEventType.DOWN,
    MouseEventType.UP,
  ];

  const filteredMouseEvents = new Set(validMouseEvents);
  function filterMouse(mouse: IMouseEventRecord): boolean {
    return filteredMouseEvents.has(mouse.event);
  }

  return {
    mouse: sessionDb.mouseEvents.all().filter(filterMouse).sort(sort),
    focus: sessionDb.focusEvents.all().sort(sort),
    scroll: sessionDb.scrollEvents.all().sort(sort),
  };
}

export interface ISessionInteractionsApi extends ICoreApi {
  args: ISessionInteractionsArgs;
  result: ISessionInteractionsResult;
}

export interface ISessionInteractionsArgs {
  sessionId: string;
  dataLocation?: string;
  mouseEventsFilter?: MouseEventType[];
}

export interface ISessionInteractionsResult {
  mouse: IMouseEventRecord[];
  focus: IFocusRecord[];
  scroll: IScrollRecord[];
}
