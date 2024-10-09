"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWsOpen = isWsOpen;
exports.wsSend = wsSend;
exports.sendWsCloseUnexpectedError = sendWsCloseUnexpectedError;
const WebSocket = require("ws");
const IPendingWaitEvent_1 = require("@ulixee/commons/interfaces/IPendingWaitEvent");
const CLOSE_UNEXPECTED_ERROR = 1011;
function isWsOpen(ws) {
    if (!ws)
        return false;
    return ws.readyState === WebSocket.OPEN;
}
async function wsSend(ws, json) {
    // give it a second to breath
    await new Promise(process.nextTick);
    if (!isWsOpen(ws)) {
        throw new IPendingWaitEvent_1.CanceledPromiseError('Websocket was not open');
    }
    await new Promise((resolve, reject) => {
        ws.send(json, error => {
            if (error)
                reject(error);
            else
                resolve();
        });
    });
}
function sendWsCloseUnexpectedError(ws, message) {
    if (isWsOpen(ws)) {
        ws.close(CLOSE_UNEXPECTED_ERROR, JSON.stringify({ message }));
    }
}
//# sourceMappingURL=WsUtils.js.map