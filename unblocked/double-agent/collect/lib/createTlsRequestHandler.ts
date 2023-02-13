import Config from '@double-agent/config/index';
import ServerResponse from '@double-agent/tls-server/lib/ServerResponse';
import IncomingMessage from '@double-agent/tls-server/lib/IncomingMessage';
import IServerContext from '../interfaces/IServerContext';
import extractRequestDetails from './extractRequestDetails';
import RequestContext from './RequestContext';
import BaseServer from '../servers/BaseServer';
import { isRecognizedDomain } from './DomainUtils';

const { TlsDomain } = Config.collect.domains;

export default function createTlsRequestHandler(
  server: BaseServer,
  serverContext: IServerContext,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async function requestHandler(req: any, res: any): Promise<void> {
    const { sessionTracker } = serverContext;
    const requestUrl = server.getRequestUrl(req as any);

    if (!isRecognizedDomain(req.headers.host, [TlsDomain])) {
      req.socket.destroy();
      console.warn('Invalid domain used to access site', req.url, req.headers.host);
      return;
    }

    const session = sessionTracker.getSessionFromServerRequest(server, req);
    const { requestDetails } = await extractRequestDetails(server, req, session);
    const ctx = new RequestContext(server, req, res, requestUrl, requestDetails, session);
    const handler = server.getHandlerFn(requestUrl.pathname);
    session.recordRequest(requestDetails);

    if (handler) {
      await handler(ctx);
    } else {
      res.writeHead(404).end(JSON.stringify({ message: 'Not found' }));
    }
  };
}
