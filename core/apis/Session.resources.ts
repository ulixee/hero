import ResourceType from '@ulixee/hero-interfaces/ResourceType';
import SessionDb from '../dbs/SessionDb';
import ICoreApi from '../interfaces/ICoreApi';

export default function sessionResourcesApi(args: ISessionResourcesArgs): ISessionResourcesResult {
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  const resources = sessionDb.resources.all();

  const omitWithoutResponse = args.omitWithoutResponse ?? true;
  const omitNonHttpGet = args.omitNonHttpGet ?? true;

  const result: ISessionResourcesResult = {
    resources: [],
  };

  for (const resource of resources) {
    if (omitWithoutResponse && !resource.responseHeaders) continue;
    if (omitNonHttpGet && resource.requestMethod !== 'GET') {
      // if this is a POST of a document, allow it
      if (resource.type !== 'Document' && resource.requestMethod === 'POST') continue;
    }

    result.resources.push({
      url: resource.requestUrl,
      id: resource.id,
      method: resource.requestMethod,
      statusCode: resource.statusCode,
      tabId: resource.tabId,
      type: resource.type,
      redirectedToUrl: resource.redirectedToUrl,
    });
  }
  return result;
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
  resources: ISessionResource[];
}

export interface ISessionResource {
  url: string;
  method: string;
  id: number;
  tabId: number;
  statusCode: number;
  type: ResourceType;
  redirectedToUrl?: string;
}

export interface ISessionFrame {
  id: number;
  isMainFrame: boolean;
  domNodePath: string;
}
