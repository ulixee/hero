import WebSocket = require('ws');

const CLOSE_UNEXPECTED_ERROR = 1011;

export function isWsOpen(ws: WebSocket): boolean {
  if (!ws) return false;
  return ws.readyState === WebSocket.OPEN;
}

export async function wsSend(ws: WebSocket, json: string): Promise<void> {
  // give it a second to breath
  await new Promise(process.nextTick);
  await new Promise<void>((resolve, reject) => {
    ws.send(json, error => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export function sendWsCloseUnexpectedError(ws: WebSocket, message: string): void {
  if (isWsOpen(ws)) {
    ws.close(CLOSE_UNEXPECTED_ERROR, JSON.stringify({ message }));
  }
}
