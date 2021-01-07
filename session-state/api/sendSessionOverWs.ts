import { IncomingMessage } from 'http';
import WebSocket from 'ws';
import Logger from '@secret-agent/commons/Logger';
import SessionLoader from './SessionLoader';
import SessionDb from '../lib/SessionDb';

const { log } = Logger(module);
const CLOSE_UNEXPECTED_ERROR = 1011;

export default async function sendSessionOverWs(
  websocket: WebSocket,
  request: IncomingMessage,
): Promise<void> {
  const { headers } = request;
  const lookupArgs = {
    scriptInstanceId: headers['script-instance-id'] as string,
    scriptEntrypoint: headers['script-entrypoint'] as string,
    sessionName: headers['session-name'] as string,
    dataLocation: headers['data-location'] as string,
    sessionId: headers['session-id'] as string,
  };
  log.stats('ReplayApi', lookupArgs);

  const { sessionId } = lookupArgs;

  let sessionLoader: SessionLoader;
  websocket.once('close', (error?: Error) => {
    sessionLoader?.close();
    sessionLoader = null;
    log.info('Replay Session Closed', { error, sessionId });
  });

  try {
    const session = SessionDb.findWithRelated(lookupArgs);

    if (!session) {
      await send(websocket, 'error', {
        message: "There aren't any stored sessions for this script.",
      });
      websocket.close();
      return;
    }

    sessionLoader = new SessionLoader(session.sessionDb, session.sessionState);

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
      ...headers,
      sessionId,
    });
  }
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
