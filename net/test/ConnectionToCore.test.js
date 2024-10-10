"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EmittingTransportToCore_1 = require("../lib/EmittingTransportToCore");
const ConnectionToCore_1 = require("../lib/ConnectionToCore");
const TransportBridge_1 = require("../lib/TransportBridge");
const ConnectionToClient_1 = require("../lib/ConnectionToClient");
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
//# sourceMappingURL=ConnectionToCore.test.js.map