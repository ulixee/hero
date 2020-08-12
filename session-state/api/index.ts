import 'source-map-support/register';
import * as http2 from 'http2';
import SessionLoader from './SessionLoader';
import SessionDb from '../lib/SessionDb';
import Logger from '@secret-agent/commons/Logger';
import ISessionReplayServer from '../interfaces/ISessionReplayServer';
import { AddressInfo } from 'net';

const { log } = Logger(module);

export function createReplayServer(): ISessionReplayServer {
  const activeClients = new Set<http2.Http2ServerResponse>();
  const server = http2.createServer((req, res) => {
    activeClients.add(res);
    try {
      const lookupArgs = {
        scriptInstanceId: req.headers['script-instance-id'] as string,
        scriptEntrypoint: req.headers['script-entrypoint'] as string,
        sessionName: req.headers['session-name'] as string,
        sessionId: req.headers['session-id'] as string,
        dataLocation: req.headers['data-location'] as string,
      };
      log.stats('ReplayApi', lookupArgs);

      const session = SessionDb.findWithRelated(lookupArgs);

      const sessionLoader = new SessionLoader(session.sessionDb, session.sessionState);

      sessionLoader.on('resources', streamResources.bind(this, res));

      for (const event of SessionLoader.eventStreams) {
        sessionLoader.on(event, streamJson.bind(this, res, event));
      }

      res.stream.on('close', () => {
        sessionLoader.removeAllListeners();
        activeClients.delete(res);
      });

      sessionLoader.on('ready', () => {
        streamJson(res, 'session', {
          ...sessionLoader.session,
          startOrigin: sessionLoader.startOrigin,
          dataLocation: session.dataLocation,
          relatedScriptInstances: session.relatedScriptInstances,
          relatedSessions: session.relatedSessions,
        });
      });

      sessionLoader.on('close', () => {
        res.end();
      });
      sessionLoader.listen();
    } catch (error) {
      res.writeHead(500).end(JSON.stringify({ message: `ERROR loading session ${error.stack}` }));
      log.error('SessionState.ErrorLoadingSession', {
        error,
        ...req.headers,
        sessionId: req.headers['session-id'] as string,
      });
    }
  });

  return {
    close: closeServer.bind(this, server, activeClients),
    hasClients() {
      return activeClients.size > 0;
    },
    async listen(listenPort: number) {
      if (server.listening) {
        return server.address() as AddressInfo;
      }
      return new Promise(resolve =>
        server.listen(listenPort, () => {
          resolve(server.address() as AddressInfo);
        }),
      );
    },
    url() {
      const addressInfo = server.address() as AddressInfo;
      return `http://127.0.0.1:${addressInfo.port}`;
    },
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
      client.stream.destroy();
    }
  } else {
    while (activeClients.size) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  await new Promise(resolve => server.close(resolve));
}

function streamJson(res: http2.Http2ServerResponse, event: string, data: any) {
  if (res.stream.closed) return;

  const json = JSON.stringify(data, (_, value) => {
    if (value !== null) return value;
  });

  res.createPushResponse({ ':path': `/${event}` }, (err, pushResponse) => {
    if (err) throw err;
    pushResponse.stream.respond({ ':status': 200 });
    pushResponse.stream.end(json);
  });
}

function streamResources(res: http2.Http2ServerResponse, resources: any[]) {
  if (res.stream.closed) return;
  for (const resource of resources) {
    const headers: any = {
      'resource-url': resource.url,
      'resource-type': resource.type,
      'resource-status-code': resource.status,
      'content-type': resource.headers['content-type'] ?? resource.headers['Content-Type'],
    };
    if (resource.encoding) {
      headers['content-encoding'] = resource.encoding;
    }
    res.createPushResponse(
      {
        ':path': '/resource',
        ...headers,
      },
      (err, pushResponse) => {
        if (err) throw err;
        pushResponse.stream.respond({ ':status': 200 });
        if (resource.type === 'Document') {
          // body won't be rendered from resource, so just send back empty
          pushResponse.stream.end(Buffer.from(''));
        } else {
          pushResponse.stream.end(resource.data);
        }
      },
    );
  }
}
