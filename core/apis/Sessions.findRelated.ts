import SessionDb from '../dbs/SessionDb';
import ICoreApi from '../interfaces/ICoreApi';
import { GlobalPool } from '../index';
import SessionsDb, { ISessionsFindRelatedResult } from '../dbs/SessionsDb';

export default function sessionsFindRelatedApi(
  args: ISessionsFindRelatedArgs,
): ISessionsFindRelatedResult {
  const dataLocation = args.dataLocation ?? GlobalPool.sessionsDir;
  // NOTE: don't close db - it's from a shared cache
  const sessionsDb = SessionsDb.find(dataLocation);
  const sessionDb = SessionDb.getCached(args.sessionId, dataLocation, true);
  const session = sessionDb.session.get();

  return sessionsDb.findRelatedSessions(session);
}

export interface ISessionsFindRelatedApi extends ICoreApi {
  args: ISessionsFindRelatedArgs;
  result: ISessionsFindRelatedResult;
}

export interface ISessionsFindRelatedArgs {
  sessionId: string;
  dataLocation?: string;
}
