import IResourceSummary from '@ulixee/hero-interfaces/IResourceSummary';
import SessionDb from '../dbs/SessionDb';
import ICoreApi from '../interfaces/ICoreApi';

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

export interface ISessionResourcesArgs {
  sessionId: string;
  omitWithoutResponse?: boolean;
  omitNonHttpGet?: boolean;
}

export interface ISessionResourcesApi extends ICoreApi {
  args: ISessionResourcesArgs;
  result: ISessionResourcesResult;
}

export interface ISessionResourcesResult {
  resources: IResourceSummary[];
}
