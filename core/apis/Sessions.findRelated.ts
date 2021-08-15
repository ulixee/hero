import SessionDb from '../dbs/SessionDb';
import ICoreApi from '../interfaces/ICoreApi';
import SessionsDb, { ISessionsFindRelatedResult } from '../dbs/SessionsDb';

export default function sessionsFindRelatedApi(
  args: ISessionsFindRelatedArgs,
): ISessionsFindRelatedResult {
  // NOTE: don't close db - it's from a shared cache
  const sessionsDb = SessionsDb.find();
  const sessionDb = SessionDb.getCached(args.sessionId, true);
  const session = sessionDb.session.get();

  return sessionsDb.findRelatedSessions(session);
}

export interface ISessionsFindRelatedApi extends ICoreApi {
  args: ISessionsFindRelatedArgs;
  result: ISessionsFindRelatedResult;
}

export interface ISessionsFindRelatedArgs {
  sessionId: string;
}
