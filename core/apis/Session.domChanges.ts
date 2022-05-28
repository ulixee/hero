import SessionDb from '../dbs/SessionDb';
import { IDomChangeRecord } from '../models/DomChangesTable';

export default function sessionDomChangesApi(
  args: ISessionDomChangesArgs,
): ISessionDomChangesResult {
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  const changes = sessionDb.domChanges.all();

  const result: ISessionDomChangesResult = {
    domChangesByTabId: {},
  };

  for (const change of changes) {
    result.domChangesByTabId[change.tabId] ??= [];
    result.domChangesByTabId[change.tabId].push(change);
  }

  for (const list of Object.values(result.domChangesByTabId)) {
    list.sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        if (a.frameId === b.frameId) {
          return a.eventIndex - b.eventIndex;
        }
        return a.frameId - b.frameId;
      }
      return a.timestamp - b.timestamp;
    });
  }

  return result;
}

interface ISessionDomChangesArgs {
  sessionId: string;
}

interface ISessionDomChangesResult {
  domChangesByTabId: { [tabId: number]: IDomChangeRecord[] };
}
