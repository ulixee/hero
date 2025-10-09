"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const TransportBridge_1 = require("../lib/TransportBridge");
const ConnectionToClient_1 = require("../lib/ConnectionToClient");
const ConnectionToCore_1 = require("../lib/ConnectionToCore");
const WsTransportToClient_1 = require("../lib/WsTransportToClient");
const WsTransportToCore_1 = require("../lib/WsTransportToCore");
const apiSpy = jest.fn();
const apiSpec = {
    api(arg1, arg2) {
        apiSpy();
        return { arg1, arg2, ok: new Date() };
    },
};
beforeEach(() => {
    apiSpy.mockReset();
});
test('it can transport over a direct connection (bridge)', async () => {
    const bridge = new TransportBridge_1.default();
    new ConnectionToClient_1.default(bridge.transportToClient, apiSpec);
    const connectionToCore = new ConnectionToCore_1.default(bridge.transportToCore);
    await expect(connectionToCore.sendRequest({ command: 'api', args: ['1', { test: true }] })).resolves.toEqual({
        arg1: '1',
        arg2: { test: true },
        ok: expect.any(Date),
    });
    expect(apiSpy).toHaveBeenCalledTimes(1);
});
test('it can transport over websockets', async () => {
    const server = new ws_1.Server({ port: 0 });
    try {
        server.on('connection', (ws, req) => {
            const transport = new WsTransportToClient_1.default(ws, req);
            new ConnectionToClient_1.default(transport, apiSpec);
        });
        const host = (await server.address());
        const wsTransportToCore = new WsTransportToCore_1.default(`ws://localhost:${host.port}`);
        const connectionToCore = new ConnectionToCore_1.default(wsTransportToCore);
        await expect(connectionToCore.sendRequest({ command: 'api', args: ['1', { test: 2 }] })).resolves.toEqual({
            arg1: '1',
            arg2: { test: 2 },
            ok: expect.any(Date),
        });
        expect(apiSpy).toHaveBeenCalledTimes(1);
    }
    finally {
        server.close();
    }
});
//# sourceMappingURL=basic.test.js.map