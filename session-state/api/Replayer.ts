import { IncomingHttpHeaders, IncomingMessage } from 'http';
import WebSocket from 'ws';
import Logger from '@secret-agent/commons/Logger';
import { createPromise } from '@secret-agent/commons/utils';
import SessionLoader from './SessionLoader';
import SessionDb, { ISessionLookup } from '../lib/SessionDb';

const { log } = Logger(module);
const CLOSE_UNEXPECTED_ERROR = 1011;

export default class Replayer {
  private pendingReplaysByWebSocket = new WeakMap<WebSocket, Promise<void>>();

  public async close(clients: WebSocket[], waitForOpenConnections: boolean): Promise<void> {
    const closePromises = clients.map(async ws => {
      if (waitForOpenConnections) {
        await this.pendingReplaysByWebSocket.get(ws);
      }
      if (isOpen(ws)) ws.terminate();
    });
    await Promise.all(closePromises);
  }

  public async handleConnection(websocket: WebSocket, request: IncomingMessage): Promise<void> {
    const isComplete = createPromise();
    this.pendingReplaysByWebSocket.set(websocket, isComplete.promise);

    try {
      const session = Replayer.lookupSession(request.headers);
      const sessionLoader = Replayer.loadSession(websocket, session);
      const sessionId = session.sessionDb.sessionId;

      const closedPromise = new Promise(resolve => sessionLoader.once('closed', resolve));
      const pendingPushes: Promise<any>[] = [closedPromise];

      for (const event of SessionLoader.eventStreams) {
        sessionLoader.on(event, data => {
          if (websocket.readyState !== WebSocket.OPEN) {
            websocket.close();
            return;
          }
          const promise = send(websocket, event, data).catch(error => {
            log.warn(`Error sending event to Replay`, {
              error,
              event,
              sessionId,
            });
          });
          pendingPushes.push(promise);
        });
      }

      const tabReadyPromise = new Promise<void>(resolve => {
        sessionLoader.once('tab-ready', () =>
          send(websocket, 'session', {
            ...sessionLoader.session,
            tabs: [...sessionLoader.tabs.values()],
            dataLocation: session.dataLocation,
            relatedScriptInstances: session.relatedScriptInstances,
            relatedSessions: session.relatedSessions,
          }).finally(resolve),
        );
      });
      pendingPushes.push(tabReadyPromise);

      sessionLoader.listen();

      await waitUntilAllComplete(pendingPushes);

      await send(websocket, 'trailer', { messages: pendingPushes.length });
      websocket.close();
    } catch (error) {
      if (websocket.readyState === WebSocket.OPEN) {
        await send(websocket, 'error', { message: error.message });
        websocket.close(CLOSE_UNEXPECTED_ERROR);
      }
      log.error('SessionState.ErrorLoadingSession', {
        error,
        sessionId: request.headers['session-id'] as string,
        ...request.headers,
      });
    } finally {
      this.pendingReplaysByWebSocket.delete(websocket);
      isComplete.resolve();
    }
  }

  private static lookupSession(headers: IncomingHttpHeaders): ISessionLookup {
    const lookupArgs = {
      scriptInstanceId: headers['script-instance-id'] as string,
      scriptEntrypoint: headers['script-entrypoint'] as string,
      sessionName: headers['session-name'] as string,
      dataLocation: headers['data-location'] as string,
      sessionId: headers['session-id'] as string,
    };

    log.stats('ReplayApi', lookupArgs);
    const session = SessionDb.findWithRelated(lookupArgs);
    if (!session) {
      log.error('Replay Api Error - no session found for script', lookupArgs);
      throw new Error("There aren't any stored sessions for this script.");
    }
    return session;
  }

  private static loadSession(websocket: WebSocket, session: ISessionLookup): SessionLoader {
    const sessionId = session.sessionDb.sessionId;
    const sessionLoader = new SessionLoader(session.sessionDb, session.sessionState);

    websocket.once('close', (error?: Error) => {
      sessionLoader.close();
      log.info('Replay Session Closed', { error, sessionId });
    });
    websocket.on('error', error => {
      sessionLoader.close();
      log.error('Replay Api Error', { error, sessionId });
    });
    return sessionLoader;
  }
}

function isOpen(ws: WebSocket) {
  return ws.readyState === WebSocket.OPEN;
}

function send(websocket: WebSocket, event: string, data: any): Promise<void> {
  if (websocket.readyState !== WebSocket.OPEN) return;
  if (Array.isArray(data) && data.length === 0) return Promise.resolve();

  const json = JSON.stringify({ event, data }, (_, value) => {
    if (value !== null) return value;
  });

  return new Promise<void>((resolve, reject) => {
    websocket.send(json, error => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function waitUntilAllComplete(pendingPushes: Promise<any>[]) {
  const resolvedPromises = new Set<Promise<any>>();
  // sort of complicated, but we're checking that everything has been sent and completed
  while (pendingPushes.length > resolvedPromises.size) {
    const allPending = [...pendingPushes];
    await Promise.all(allPending.map(x => x.catch(err => err)));
    for (const pending of allPending) resolvedPromises.add(pending);
    await new Promise(setImmediate);
  }
}
