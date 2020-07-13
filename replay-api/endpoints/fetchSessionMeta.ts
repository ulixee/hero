import * as Path from 'path';
import SessionDb from '@secret-agent/session-state/lib/SessionDb';
import SessionsDb from '@secret-agent/session-state/lib/SessionsDb';
import SessionLoader from '../lib/SessionLoader';
import IContext from '../interfaces/IContext';

const readonlyAndFileMustExist = { readonly: true, fileMustExist: true };

export default async function fetchSessionMeta(ctx: IContext) {
  const { dataLocation, id, name, scriptInstanceId } = ctx.query;
  const relatedScriptInstances: { id: string; startDate: string; defaultSessionId }[] = [];
  const relatedSessions: { id: string; name: string }[] = [];
  const ext = Path.extname(dataLocation);
  const dataLocationIsDb = ext === '.db';

  let sessionDb: SessionDb;
  let sessionsDb: SessionsDb;

  if (dataLocationIsDb) {
    const baseDir = Path.dirname(dataLocation);
    const sessionId = Path.basename(dataLocation, ext);
    sessionDb = new SessionDb(baseDir, sessionId, readonlyAndFileMustExist);
    sessionsDb = new SessionsDb(baseDir, readonlyAndFileMustExist);
  } else if (id) {
    sessionDb = new SessionDb(dataLocation, id, readonlyAndFileMustExist);
    sessionsDb = new SessionsDb(dataLocation, readonlyAndFileMustExist);
  } else {
    sessionsDb = new SessionsDb(dataLocation, readonlyAndFileMustExist);
    const { id: sessionId } = sessionsDb.sessions.findByName(name, scriptInstanceId);
    sessionDb = new SessionDb(dataLocation, sessionId, readonlyAndFileMustExist);
  }

  const session = sessionDb.session.get();
  const otherSessions = sessionsDb.sessions.findByScriptEntrypoint(session.scriptEntrypoint);
  for (const otherSession of otherSessions) {
    relatedScriptInstances.push({
      id: otherSession.scriptInstanceId,
      startDate: otherSession.scriptStartDate,
      defaultSessionId: otherSession.id,
    });
    if (otherSession.scriptInstanceId === session.scriptInstanceId) {
      relatedSessions.push({ id: otherSession.id, name: otherSession.name });
    }
  }

  const sessionLoader = new SessionLoader(sessionDb);

  return {
    ...session,
    relatedScriptInstances: relatedScriptInstances,
    relatedSessions: relatedSessions,
    pages: sessionLoader.pages,
    durationMillis: sessionLoader.durationMillis,
    ticks: sessionLoader.ticks,
    paintEvents: sessionLoader.paintEvents,
    mouseEvents: sessionLoader.mouseEvents,
    scrollEvents: sessionLoader.scrollEvents,
    focusEvents: sessionLoader.focusEvents,
    commandResults: sessionLoader.commandResults,
  };
}
