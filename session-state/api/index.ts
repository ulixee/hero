import * as http from 'http';
import WebSocket from 'ws';
import Logger from '@secret-agent/commons/Logger';
import { AddressInfo } from 'net';
import ISessionReplayServer from '../interfaces/ISessionReplayServer';
import sendSessionOverWs from './sendSessionOverWs';

const { log } = Logger(module);

export async function createReplayServer(listenPort?: number): Promise<ISessionReplayServer> {
  const completionPromiseBySocket = new WeakMap<WebSocket, Promise<void>>();
  const server = await startServer(listenPort);

  const ws = new WebSocket.Server({ server });
  ws.on('connection', async (webSocket, request) => {
    const isComplete = sendSessionOverWs(webSocket, request);
    completionPromiseBySocket.set(webSocket, isComplete);
    webSocket.once('close', () => completionPromiseBySocket.delete(webSocket));
    await isComplete;
    if (webSocket.readyState === WebSocket.OPEN) webSocket.close();
  });

  const port = (server.address() as AddressInfo).port;
  return {
    async close(waitForOpenConnections = false): Promise<void> {
      log.info('ReplayServer.closeSessions', { waitForOpenConnections, sessionId: null });
      for (const webSocket of ws.clients) {
        if (waitForOpenConnections) {
          await completionPromiseBySocket.get(webSocket);
        }
        if (webSocket.readyState === WebSocket.OPEN) webSocket.terminate();
      }
      server.unref().close();
    },
    url: `ws://127.0.0.1:${port}`,
    port,
  };
}

async function startServer(port: number): Promise<http.Server> {
  const server = http.createServer();
  server.on('error', err => {
    log.error('Replay server error', {
      error: err,
      sessionId: null,
    });
  });
  await new Promise<void>(resolve => server.listen(port, resolve));
  return server;
}
