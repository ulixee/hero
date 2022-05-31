import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import SessionDb from '../dbs/SessionDb';

export default function sessionResourcesApi(args: ISessionResourcesArgs): ISessionResourcesResult {
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  const resources = sessionDb.resources.filter({
    hasResponse: args.omitWithoutResponse ?? true,
    isGetOrDocument: args.omitNonHttpGet ?? true,
  });

  return {
    resources,
  };
}

interface ISessionResourcesArgs {
  sessionId: string;
  omitWithoutResponse?: boolean;
  omitNonHttpGet?: boolean;
}

interface ISessionResourcesResult {
  resources: IResourceSummary[];
}
