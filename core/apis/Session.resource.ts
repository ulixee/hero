import IHttpHeaders from '@unblocked-web/specifications/agent/net/IHttpHeaders';
import SessionDb from '../dbs/SessionDb';

export default function sessionResourceApi(args: ISessionResourceArgs): ISessionResourceResult {
  const sessionDb = SessionDb.getCached(args.sessionId, true);

  const resource = sessionDb.resources.getResponse(args.resourceId);
  if (resource) {
    const headers = JSON.parse(resource.responseHeaders ?? '{}');
    return {
      resource: {
        statusCode: resource.statusCode,
        headers,
        body: resource.responseData,
      },
    };
  }

  return {
    resource: {
      statusCode: 404,
      headers: {},
      body: null,
    },
  };
}

interface ISessionResourceArgs {
  sessionId: string;
  resourceId: number;
}

interface ISessionResourceResult {
  resource: ISessionResourceDetails;
}

export interface ISessionResourceDetails {
  body: Buffer;
  headers: IHttpHeaders;
  statusCode: number;
}
