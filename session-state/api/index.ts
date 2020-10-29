import * as http2 from 'http2';
import Logger from '@secret-agent/commons/Logger';
import { AddressInfo } from 'net';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import SessionLoader from './SessionLoader';
import SessionDb from '../lib/SessionDb';
import ISessionReplayServer from '../interfaces/ISessionReplayServer';

const { log } = Logger(module);

export async function createReplayServer(listenPort?: number): Promise<ISessionReplayServer> {
  const activeClients = new Set<http2.Http2ServerResponse>();
  const server = http2.createServer((req, res) => {
    activeClients.add(res);
    const sessionId = req.headers['session-id'] as string;

    const listeners: eventUtils.IRegisteredEventListener[] = [];
    try {
      const lookupArgs = {
        scriptInstanceId: req.headers['script-instance-id'] as string,
        scriptEntrypoint: req.headers['script-entrypoint'] as string,
        sessionName: req.headers['session-name'] as string,
        dataLocation: req.headers['data-location'] as string,
        sessionId,
      };
      log.stats('ReplayApi', lookupArgs);

      const session = SessionDb.findWithRelated(lookupArgs);

      const sessionLoader = new SessionLoader(session.sessionDb, session.sessionState);

      let hasSentSession = false;

      listeners.push(
        eventUtils.addEventListener(sessionLoader, 'resources', http2PushResources.bind(this, res)),
      );

      for (const event of SessionLoader.eventStreams) {
        listeners.push(
          eventUtils.addEventListener(sessionLoader, event, http2PushJson.bind(this, res, event)),
        );
      }

      res.stream.session.on('error', err =>
        log.error('Replay Http2Session Error', {
          error: err,
          sessionId,
        }),
      );

      res.stream.on('error', err =>
        log.error('Replay Server Error', {
          error: err,
          sessionId,
        }),
      );

      res.on('close', () => {
        log.info('Replay Server Closed', { sessionId });
        eventUtils.removeEventListeners(listeners);
        activeClients.delete(res);
        if (res.socket) {
          res.socket.unref();
          res.socket.destroy();
        }
      });

      sessionLoader.on('tab-ready', () => {
        if (hasSentSession) return;
        hasSentSession = true;

        http2PushJson(res, 'session', {
          ...sessionLoader.session,
          tabs: [...sessionLoader.tabs.values()],
          dataLocation: session.dataLocation,
          relatedScriptInstances: session.relatedScriptInstances,
          relatedSessions: session.relatedSessions,
        });
      });

      sessionLoader.listen();
    } catch (error) {
      res.writeHead(500).end(JSON.stringify({ message: `ERROR loading session ${error.stack}` }));
      log.error('SessionState.ErrorLoadingSession', {
        error,
        ...req.headers,
        sessionId,
      });
    }
  });

  const address = await new Promise<AddressInfo>(resolve =>
    server.listen(listenPort, () => {
      resolve(server.address() as AddressInfo);
    }),
  );

  return {
    close: closeServer.bind(this, server, activeClients),
    hasClients() {
      return activeClients.size > 0;
    },
    url: `http://127.0.0.1:${address.port}`,
    port: address.port,
  };
}

async function closeServer(
  server: http2.Http2Server,
  activeClients: Set<http2.Http2ServerResponse>,
  waitForOpenConnections = false,
) {
  if (!waitForOpenConnections) {
    for (const client of activeClients) {
      client.end();
      if (client.socket) {
        client.socket.unref();
        client.socket.destroy();
      }
      client.stream.destroy();
    }
    server.unref().close();
  } else {
    await new Promise(resolve => server.close(resolve));
  }
}

function http2PushJson(res: http2.Http2ServerResponse, event: string, data: any) {
  if (res.stream.closed) return;

  const json = JSON.stringify(data, (_, value) => {
    if (value !== null) return value;
  });

  res.createPushResponse({ ':path': `/${event}` }, (err, pushResponse) => {
    if (err) {
      log.warn(`Error sending ${event} to Replay`, {
        err,
        sessionId: this.sessionId,
      });
      return;
    }
    pushResponse.stream.respond({ ':status': 200 });
    pushResponse.stream.end(json);
  });
}

async function http2PushResources(res: http2.Http2ServerResponse, resources: any[]) {
  if (res.stream.closed) return;
  let promises: Promise<any>[] = [];
  for (const resource of resources) {
    const headers: any = {
      'resource-url': resource.url,
      'resource-type': resource.type,
      'resource-status-code': resource.status,
      'resource-headers': JSON.stringify(resource.headers),
      'resource-tabid': resource.tabId,
    };
    const promise = new Promise(resolve => {
      res.createPushResponse(
        {
          ':path': '/resource',
          ...headers,
        },
        (err, pushResponse) => {
          if (err) {
            log.warn(`Error sending resource to Replay`, {
              err,
              url: resource.url,
              sessionId: this.sessionId,
            });
            return;
          }
          pushResponse.stream.respond({ ':status': 200 });
          if (resource.type === 'Document') {
            // body won't be rendered from resource, so just send back empty
            pushResponse.stream.end(Buffer.from(''), resolve);
          } else {
            pushResponse.stream.end(resource.data, resolve);
          }
        },
      );
    });
    promises.push(promise);
    if (promises.length === 10) {
      await Promise.all(promises);
      promises = [];
    }
  }
}
