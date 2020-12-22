import * as http2 from 'http2';
import Logger from '@secret-agent/commons/Logger';
import { AddressInfo } from 'net';
import * as eventUtils from '@secret-agent/commons/eventUtils';
import IRegisteredEventListener from '@secret-agent/core-interfaces/IRegisteredEventListener';
import { createPromise } from '@secret-agent/commons/utils';
import SessionLoader from './SessionLoader';
import SessionDb from '../lib/SessionDb';
import ISessionReplayServer from '../interfaces/ISessionReplayServer';

const { log } = Logger(module);

export async function createReplayServer(listenPort?: number): Promise<ISessionReplayServer> {
  const activeClients = new Map<
    string,
    { stream: http2.ServerHttp2Stream; pendingPushes: Promise<any>[] }
  >();
  const server = http2.createServer();

  server.on('error', err => {
    log.error('Replay server error', {
      error: err,
      sessionId: null,
    });
  });

  server.on('stream', (stream, headers) => {
    const pendingPushes: Promise<any>[] = [];
    const sessionId = headers['session-id'] as string;

    activeClients.set(sessionId, { stream, pendingPushes });
    const listeners: IRegisteredEventListener[] = [];
    const lookupArgs = {
      scriptInstanceId: headers['script-instance-id'] as string,
      scriptEntrypoint: headers['script-entrypoint'] as string,
      sessionName: headers['session-name'] as string,
      dataLocation: headers['data-location'] as string,
      sessionId,
    };
    log.stats('ReplayApi', lookupArgs);

    try {
      const session = SessionDb.findWithRelated(lookupArgs);

      if (!session) {
        stream.respond({ ':status': 404 });
        stream.end(
          JSON.stringify({ message: "There aren't any stored sessions for this script." }),
        );
        stream.close();
        return;
      }

      const sessionLoader = new SessionLoader(session.sessionDb, session.sessionState);

      const closedPromise = createPromise();
      pendingPushes.push(closedPromise.promise);

      let hasSentSession = false;

      listeners.push(
        eventUtils.addEventListener(sessionLoader, 'resources', resource => {
          const promise = http2PushResources(stream, resource);
          pendingPushes.push(promise);
        }),
      );

      for (const event of SessionLoader.eventStreams) {
        const registration = eventUtils.addEventListener(sessionLoader, event, data => {
          const promise = http2PushJson(stream, event, data);
          pendingPushes.push(promise);
          if (event === 'script-state') {
            if (data?.closeDate) {
              closedPromise.resolve();
            }
          }
        });

        listeners.push(registration);
      }

      stream.on('error', err => {
        activeClients.delete(sessionId);
        log.error('Replay Server Error', {
          error: err,
          sessionId,
        });
      });

      stream.on('close', () => {
        log.info('Replay Server Closed', { sessionId });
        eventUtils.removeEventListeners(listeners);
        activeClients.delete(sessionId);
        stream.session?.close();
        stream.session?.unref();
      });

      sessionLoader.on('tab-ready', () => {
        if (hasSentSession) return;
        hasSentSession = true;

        const promise = http2PushJson(stream, 'session', {
          ...sessionLoader.session,
          tabs: [...sessionLoader.tabs.values()],
          dataLocation: session.dataLocation,
          relatedScriptInstances: session.relatedScriptInstances,
          relatedSessions: session.relatedSessions,
        });
        pendingPushes.push(promise);
      });

      const readyForTrailers = createPromise();
      pendingPushes.push(readyForTrailers.promise);
      stream.on('wantTrailers', () => {
        readyForTrailers.resolve();
        // need this even so http2 doesn't auto-close the session
      });

      sessionLoader.listen();

      if (sessionLoader.session.closeDate) {
        closedPromise.resolve();
      }
      // wait for trailers will stop connection from closing pre-emptively
      stream.respond({ ':status': 200 }, { waitForTrailers: true });
      stream.end();

      return checkForClose(sessionId);
    } catch (error) {
      stream.respond({ ':status': 500 });
      stream.end(JSON.stringify({ message: `ERROR loading session ${error.stack}` }));
      stream.close();
      log.error('SessionState.ErrorLoadingSession', {
        error,
        ...headers,
        sessionId,
      });
    }
  });

  const address = await new Promise<AddressInfo>(resolve =>
    server.listen(listenPort, () => {
      resolve(server.address() as AddressInfo);
    }),
  );

  async function checkForClose(sessionId: string) {
    const client = activeClients.get(sessionId);
    if (!client) return;

    const { pendingPushes, stream } = client;

    const resolvedPromises: Set<Promise<any>> = new Set();
    // this can get called 2x, so if you take out of pendingPromises, it might not get waited for
    // on Core.close -> ReplayServer.close
    while (pendingPushes.length > resolvedPromises.size) {
      const allPending = [...pendingPushes];
      await Promise.all(allPending.map(x => x.catch(err => err)));
      for (const pending of allPending) resolvedPromises.add(pending);
      await new Promise(setImmediate);
    }

    if (!stream.destroyed) {
      stream.sendTrailers({ 'pushes-sent': resolvedPromises.size });
    }
    activeClients.delete(sessionId);
  }

  return {
    close: closeServer.bind(this, server, activeClients, checkForClose.bind(this)),
    hasClients() {
      return activeClients.size > 0;
    },
    url: `http://127.0.0.1:${address.port}`,
    port: address.port,
  };
}

async function closeServer(
  server: http2.Http2Server,
  activeClients: Map<string, { stream: http2.ServerHttp2Stream; pendingPushes: Promise<any>[] }>,
  checkForClose: (sessionId: string) => Promise<any>,
  waitForOpenConnections = false,
) {
  log.info('ReplayServer.closeSessions', { waitForOpenConnections, sessionId: null });
  for (const [id, { stream }] of activeClients) {
    if (waitForOpenConnections) {
      await checkForClose(id);
    }
    stream.session?.unref();
    stream.session?.close();
    stream.destroy();
  }
  server.unref().close();
}

function http2PushJson(stream: http2.ServerHttp2Stream, event: string, data: any): Promise<void> {
  if (Array.isArray(data) && data.length === 0) return Promise.resolve();
  const json = JSON.stringify(data, (_, value) => {
    if (value !== null) return value;
  });
  return sendHttp2Push(stream, event, json).catch(error => {
    log.warn(`Error sending event to Replay`, {
      error,
      event,
      sessionId: this.sessionId,
    });
  });
}

async function http2PushResources(
  stream: http2.ServerHttp2Stream,
  resources: any[],
): Promise<void> {
  if (stream.closed) return;
  let promises: Promise<any>[] = [];
  for (const resource of resources) {
    const headers: any = {
      'resource-url': resource.url,
      'resource-type': resource.type,
      'resource-status-code': resource.status,
      'resource-headers': JSON.stringify(resource.headers),
      'resource-tabid': resource.tabId,
    };
    const promise = sendHttp2Push(stream, 'resource', resource.data, headers).catch(error => {
      log.warn(`Error sending resource to Replay`, {
        error,
        url: resource.url,
        sessionId: this.sessionId,
      });
    });
    promises.push(promise);
    if (promises.length === 10) {
      await Promise.all(promises);
      promises = [];
    }
  }
  await Promise.all(promises);
}

function sendHttp2Push(
  stream: http2.ServerHttp2Stream,
  event: string,
  data: any,
  headers: object = {},
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (stream.closed) return;
    stream.pushStream({ ':path': `/${event}`, ...headers }, (error, pushStream) => {
      if (error) return reject(error);

      pushStream.once('error', reject);
      pushStream.respond({ ':status': 200 });
      pushStream.end(data, resolve);
    });
  });
}
