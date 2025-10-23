"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConnectionToClient_1 = require("../lib/ConnectionToClient");
const EmittingTransportToClient_1 = require("../lib/EmittingTransportToClient");
test('should route messages from client to the right API', () => {
    const apis = { 'Api.test': jest.fn() };
    const clientTransport = new EmittingTransportToClient_1.default();
    const connection = new ConnectionToClient_1.default(clientTransport, apis);
    connection.transport.emit('message', {
        command: 'Api.test',
        args: [],
        messageId: '1',
        sendTime: Date.now(),
    });
    expect(apis['Api.test']).toHaveBeenCalledTimes(1);
});
test('should call disconnect once on a connection', async () => {
    const clientTransport = new EmittingTransportToClient_1.default();
    const connection = new ConnectionToClient_1.default(clientTransport, {});
    clientTransport.disconnect = jest.fn();
    await connection.disconnect();
    expect(clientTransport.disconnect).toHaveBeenCalledTimes(1);
});
//# sourceMappingURL=ConnectionToClient.test.js.map