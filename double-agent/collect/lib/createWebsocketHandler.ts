import * as http from 'http';
import WebSocket = require('ws');
import * as net from 'net';
import ResourceType from '../interfaces/ResourceType';
import extractRequestDetails from './extractRequestDetails';
import RequestContext from './RequestContext';
import IServerContext from '../interfaces/IServerContext';
import BaseServer from '../servers/BaseServer';

export default function createWebsocketHandler(
  server: BaseServer,
  detectionContext: IServerContext,
): (req: http.IncomingMessage, socket: net.Socket, head) => Promise<void> {
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  return async function websocketHandler(
    req: http.IncomingMessage,
    socket: net.Socket,
    head,
  ): Promise<void> {
    const { sessionTracker } = detectionContext;
    const session = sessionTracker.getSessionFromServerRequest(server, req);
    sessionTracker.touchSession(session.id);
    const { requestDetails, requestUrl } = await extractRequestDetails(
      server,
      req,
      session,
      ResourceType.WebsocketUpgrade,
    );
    const ctx = new RequestContext(server, req, null, requestUrl, requestDetails, session);
    const userAgentId = ctx.session.userAgentId;
    session.recordRequest(requestDetails);

    console.log(
      '%s %s: from %s (%s)',
      'WS',
      requestDetails.url,
      requestDetails.remoteAddress,
      userAgentId,
    );

    const handlerFn = server.getHandlerFn(requestUrl.pathname);

    wss.handleUpgrade(req, socket, head, async (ws) => {
      if (handlerFn) {
        await handlerFn(ctx);
      }
      ws.on('message', async (message: WebSocket.Data) => {
        console.log(`WS: Received message ${message} on ${req.headers.host}`);
        ws.send('back at you');
      });
    });
  };
}
