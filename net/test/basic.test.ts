import { AddressInfo, Server } from 'ws';
import TransportBridge from '../lib/TransportBridge';
import ConnectionToClient from '../lib/ConnectionToClient';
import ConnectionToCore from '../lib/ConnectionToCore';
import WsTransportToClient from '../lib/WsTransportToClient';
import WsTransportToCore from '../lib/WsTransportToCore';

const apiSpy = jest.fn();
const apiSpec = {
  api(arg1: string, arg2: { test: boolean }) {
    apiSpy();
    return { arg1, arg2, ok: new Date() };
  },
};

beforeEach(() => {
  apiSpy.mockReset();
});

test('it can transport over a direct connection (bridge)', async () => {
  const bridge = new TransportBridge();
  new ConnectionToClient(bridge.transportToClient, apiSpec);
  const connectionToCore = new ConnectionToCore(bridge.transportToCore);
  await expect(
    connectionToCore.sendRequest({ command: 'api', args: ['1', { test: true }] }),
  ).resolves.toEqual({
    arg1: '1',
    arg2: { test: true },
    ok: expect.any(Date),
  });
  expect(apiSpy).toHaveBeenCalledTimes(1);
});

test('it can transport over websockets', async () => {
  const server = new Server({ port: 0 });
  try {
    server.on('connection', (ws, req) => {
      const transport = new WsTransportToClient(ws, req);
      new ConnectionToClient(transport, apiSpec);
    });
    const host = (await server.address()) as AddressInfo;

    const wsTransportToCore = new WsTransportToCore(`ws://localhost:${host.port}`);

    const connectionToCore = new ConnectionToCore(wsTransportToCore);
    await expect(
      connectionToCore.sendRequest({ command: 'api', args: ['1', { test: 2 }] }),
    ).resolves.toEqual({
      arg1: '1',
      arg2: { test: 2 },
      ok: expect.any(Date),
    });
    expect(apiSpy).toHaveBeenCalledTimes(1);
  } finally {
    server.close();
  }
});
