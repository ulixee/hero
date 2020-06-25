import SessionDb from '@secret-agent/shared-session-state/lib/SessionDb';
import SessionLoader from '../lib/SessionLoader';
import IContext from '../interfaces/IContext';

const readonlyAndFileMustExist = { readonly: true, fileMustExist: true };

export default async function fetchPaintEvents(ctx: IContext) {
  const { dataLocation, sessionId, fromPaintEventIdx, toPaintEventIdx } = ctx.query;

  const sessionDb = new SessionDb(dataLocation, sessionId, readonlyAndFileMustExist);
  const sessionLoader = new SessionLoader(sessionDb);

  return sessionLoader.fetchPaintEventsSlice(fromPaintEventIdx, toPaintEventIdx);
}
