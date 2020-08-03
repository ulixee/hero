import * as Path from 'path';
import SessionDb from '@secret-agent/session-state/lib/SessionDb';
import SessionsDb from '@secret-agent/session-state/lib/SessionsDb';
import SessionLoader from '../lib/SessionLoader';
import { IncomingMessage, ServerResponse } from 'http';
import * as url from 'url';

const readonlyAndFileMustExist = { readonly: true, fileMustExist: true };

export default async function fetchSessionMeta(req: IncomingMessage, res: ServerResponse) {
  const reqUrl = url.parse(req.headers.host + req.url, true);
  const { name, scriptInstanceId, scriptEntrypoint } = reqUrl.query;
  let sessionId = reqUrl.query.id as string;
  let dataLocation = reqUrl.query.dataLocation as string;
  const relatedScriptInstances: { id: string; startDate: string; defaultSessionId }[] = [];
  const relatedSessions: { id: string; name: string }[] = [];

  let sessionDb: SessionDb;
  let sessionsDb: SessionsDb;

  const ext = Path.extname(dataLocation as string);
  if (ext === '.db') {
    sessionId = Path.basename(dataLocation, ext);
    dataLocation = Path.dirname(dataLocation);
  }
  console.log('opening sessions db', { dataLocation });
  sessionsDb = new SessionsDb(dataLocation, readonlyAndFileMustExist);

  if (!sessionId) {
    if (name && scriptInstanceId) {
      const sessionRecord = sessionsDb.sessions.findByName(
        name as string,
        scriptInstanceId as string,
      );
      sessionId = sessionRecord.id;
    } else if (scriptEntrypoint) {
      const sessionRecords = sessionsDb.sessions.findByScriptEntrypoint(scriptEntrypoint as string);
      sessionId = sessionRecords[0].id;
    }
  }
  console.log('opening session_ db', { dataLocation, sessionId });
  sessionDb = new SessionDb(dataLocation, sessionId, readonlyAndFileMustExist);

  try {
    const session = sessionDb.session.get();
    if (sessionsDb) {
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
    }

    const sessionLoader = new SessionLoader(sessionDb);

    res.writeHead(200, {
      'content-type': 'application/json',
    });
    res.end(
      JSON.stringify({
        ...session,
        dataLocation,
        unresponsiveSeconds: sessionLoader.unresponsiveSeconds,
        hasRecentErrors: sessionLoader.hasRecentErrors,
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
      }),
    );
  } finally {
    sessionDb.close();
    sessionsDb.close();
  }
}
