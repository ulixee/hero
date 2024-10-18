"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const node_http_1 = require("node:http");
const EmittingTransportToCore_1 = require("../lib/EmittingTransportToCore");
const ConnectionToCore_1 = require("../lib/ConnectionToCore");
const TransportBridge_1 = require("../lib/TransportBridge");
const ConnectionToClient_1 = require("../lib/ConnectionToClient");
const WsTransportToClient_1 = require("../lib/WsTransportToClient");
const WsTransportToCore_1 = require("../lib/WsTransportToCore");
const apiSpy = jest.fn();
const apiSpec = {
    api(test) {
        apiSpy();
        return { test };
    },
};
beforeEach(() => {
    apiSpy.mockReset();
});
const needsClosing = [];
afterEach(async () => {
    while (needsClosing.length) {
        await needsClosing.pop()();
    }
});
test('should call connect callbacks a single time', async () => {
    const coreTransport = new EmittingTransportToCore_1.default();
    const connection = new ConnectionToCore_1.default(coreTransport);
    connection.hooks.afterConnectFn = jest.fn();
    await Promise.all([connection.connect(), connection.connect()]);
    expect(connection.hooks.afterConnectFn).toHaveBeenCalledTimes(1);
});
test('should be able to wait for a response to a message', async () => {
    const bridge = new TransportBridge_1.default();
    const connectionToCore = new ConnectionToCore_1.default(bridge.transportToCore);
    new ConnectionToClient_1.default(bridge.transportToClient, {
        test() {
            return 'called';
        },
    });
    const response = await connectionToCore.sendRequest({ command: 'test', args: [] });
    expect(response).toBe('called');
});
test('should cancel connect messages if a connection closes before connecting', async () => {
    const bridge = new TransportBridge_1.default();
    const connectionToCore = new ConnectionToCore_1.default(bridge.transportToCore);
    let connectResult = 1;
    connectionToCore.hooks.afterConnectFn = async function () {
        try {
            connectResult = await connectionToCore.sendRequest({ command: 'test', args: [] });
        }
        catch (err) {
            connectResult = err;
            throw err;
        }
    };
    const connectPromise = connectionToCore.connect();
    await new Promise(setImmediate);
    // @ts-expect-error
    expect(connectionToCore.connectMessageId).toBeTruthy();
    connectionToCore.transport.isConnected = false;
    connectionToCore.transport.emit('disconnected');
    await expect(connectionToCore.connectPromise).rejects.toThrow('disconnected');
    // @ts-expect-error
    expect(connectionToCore.connectMessageId).toBeFalsy();
    expect(connectResult?.toString()).toMatch('disconnected');
    await expect(connectPromise).rejects.toThrow();
});
test('should be able to reconnect after a disconnect', async () => {
    const server = new node_http_1.Server();
    const wss = new ws_1.Server({ server });
    try {
        server.listen(0);
        wss.on('connection', (ws, req) => {
            const transport = new WsTransportToClient_1.default(ws, req);
            new ConnectionToClient_1.default(transport, apiSpec);
        });
        const host = server.address();
        const wsTransportToCore = new WsTransportToCore_1.default(`ws://localhost:${host.port}`);
        const connectionToCore = new ConnectionToCore_1.default(wsTransportToCore);
        needsClosing.push(() => connectionToCore.disconnect());
        await expect(connectionToCore.sendRequest({ command: 'api', args: [true] })).resolves.toEqual({
            test: true,
        });
        expect(apiSpy).toHaveBeenCalledTimes(1);
        expect(wss.clients.size).toBe(1);
        const didDisconnect = new Promise(resolve => wsTransportToCore.once('disconnected', resolve));
        for (const client of wss.clients) {
            client.close();
        }
        await didDisconnect;
        expect(connectionToCore.transport.isConnected).toBe(false);
        await expect(connectionToCore.sendRequest({ command: 'api', args: [true] })).resolves.toEqual({
            test: true,
        });
    }
    finally {
        wss.close();
        server.unref().close();
    }
});
//# sourceMappingURL=ConnectionToCore.test.js.map