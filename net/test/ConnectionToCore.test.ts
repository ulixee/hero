import { AddressInfo, Server as WebsocketServer } from 'ws';
import { Server } from 'node:http';
import EmittingTransportToCore from '../lib/EmittingTransportToCore';
import ConnectionToCore from '../lib/ConnectionToCore';
import TransportBridge from '../lib/TransportBridge';
import ConnectionToClient from '../lib/ConnectionToClient';
import WsTransportToClient from '../lib/WsTransportToClient';
import WsTransportToCore from '../lib/WsTransportToCore';

const apiSpy = jest.fn();
const apiSpec = {
  api(test: any) {
    apiSpy();
    return { test };
  },
};

beforeEach(() => {
  apiSpy.mockReset();
});

const needsClosing: ((...args: any[]) => Promise<any> | any)[] = [];

afterEach(async () => {
  while (needsClosing.length) {
    await needsClosing.pop()();
  }
});

test('should call connect callbacks a single time', async () => {
  const coreTransport = new EmittingTransportToCore();
  const connection = new ConnectionToCore(coreTransport);
  connection.hooks.afterConnectFn = jest.fn();

  await Promise.all([connection.connect(), connection.connect()]);
  expect(connection.hooks.afterConnectFn).toHaveBeenCalledTimes(1);
});

test('should be able to wait for a response to a message', async () => {
  const bridge = new TransportBridge();
  const connectionToCore = new ConnectionToCore(bridge.transportToCore);
  new ConnectionToClient(bridge.transportToClient, {
    test() {
      return 'called';
    },
  });

  const response = await connectionToCore.sendRequest({ command: 'test', args: [] });
  expect(response).toBe('called');
});

test('should cancel connect messages if a connection closes before connecting', async () => {
  const bridge = new TransportBridge();
  const connectionToCore = new ConnectionToCore(bridge.transportToCore);

  let connectResult = 1;
  connectionToCore.hooks.afterConnectFn = async function () {
    try {
      connectResult = await connectionToCore.sendRequest({ command: 'test', args: [] });
    } catch (err) {
      connectResult = err;
      throw err;
    }
  };
  const connectPromise = connectionToCore.connect();
  await new Promise(setImmediate);

  expect(connectionToCore.connectAction.hookMessageId).toBeTruthy();
  const connectAction = connectionToCore.connectAction;
  connectionToCore.transport.emit('disconnected');
  await expect(connectAction.resolvable).rejects.toThrow('disconnected');

  expect(connectionToCore.connectAction?.hookMessageId).toBeFalsy();
  expect(connectResult?.toString()).toMatch('disconnected');
  await expect(connectPromise).rejects.toThrow();
});

test('should be able to reconnect after a disconnect', async () => {
  const server = new Server();
  const wss = new WebsocketServer({ server });
  apiSpy.mockClear();
  try {
    server.listen(0);
    wss.on('connection', (ws, req) => {
      const transport = new WsTransportToClient(ws, req);
      new ConnectionToClient(transport, apiSpec);
    });
    const host = server.address() as AddressInfo;

    const wsTransportToCore = new WsTransportToCore(`ws://localhost:${host.port}`);

    const disconnectSpy = jest.spyOn(ConnectionToCore.prototype, 'disconnect');
    const terminateSpy = jest.spyOn<any, any>(ConnectionToCore.prototype, 'onConnectionTerminated');
    const connectionToCore = new ConnectionToCore(wsTransportToCore);
    needsClosing.push(() => connectionToCore.disconnect());
    await expect(connectionToCore.sendRequest({ command: 'api', args: [1] })).resolves.toEqual({
      test: 1,
    });
    expect(apiSpy).toHaveBeenCalledTimes(1);
    const disconnects = jest.fn();
    connectionToCore.on('disconnected', disconnects);
    for (let i = 0; i < 10; i++) {
      disconnectSpy.mockClear();
      terminateSpy.mockClear();
      apiSpy.mockClear();
      const didDisconnect = new Promise(resolve => wsTransportToCore.once('disconnected', resolve));
      expect(wss.clients.size).toBe(1);
      for (const client of wss.clients) {
        client.close();
      }
      await didDisconnect;

      expect(disconnects).toHaveBeenCalledTimes(i + 1);
      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(terminateSpy).toHaveBeenCalledTimes(1);
      expect(connectionToCore.transport.isConnected).toBe(false);
      expect(connectionToCore.connectAction).toBeFalsy();
      // @ts-expect-error
      expect(connectionToCore.lastDisconnectDate).toBeTruthy();
      expect(connectionToCore.shouldAutoConnect()).toBe(false);

      // @ts-expect-error
      connectionToCore.lastDisconnectDate = new Date(
        // @ts-expect-error
        connectionToCore.lastDisconnectDate.getTime() - 1000,
      );
      expect(connectionToCore.shouldAutoConnect()).toBe(true);

      await expect(
        connectionToCore.sendRequest({ command: 'api', args: [i + 2] }),
      ).resolves.toEqual({
        test: i + 2,
      });
      expect(apiSpy).toHaveBeenCalledTimes(1);
      expect(connectionToCore.connectAction).toBeTruthy();
    }
  } finally {
    wss.close();
    server.unref().close();
  }
});
