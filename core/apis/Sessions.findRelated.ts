import SessionDb from '../dbs/SessionDb';
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

interface ISessionsFindRelatedArgs {
  sessionId: string;
}
