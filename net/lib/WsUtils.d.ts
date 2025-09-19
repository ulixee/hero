import WebSocket = require('ws');
export declare function isWsOpen(ws: WebSocket): boolean;
export declare function wsSend(ws: WebSocket, json: string): Promise<void>;
export declare function sendWsCloseUnexpectedError(ws: WebSocket, message: string): void;
