import SessionDb, { ISessionFindArgs, ISessionFindResult } from '../dbs/SessionDb';

export default function sessionFindApi(lookup: ISessionFindArgs): ISessionFindResult {
  const sessionLookup = SessionDb.find(lookup);

  if (!sessionLookup) {
    throw new Error(
      `No sessions found with the given lookup parameters (${JSON.stringify(
        lookup,
        (key, value) => value,
        2,
      )})`,
    );
  }

  return sessionLookup;
}

