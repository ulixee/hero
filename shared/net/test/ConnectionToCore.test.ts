import EmittingTransportToCore from '../lib/EmittingTransportToCore';
import ConnectionToCore from '../lib/ConnectionToCore';
import TransportBridge from '../lib/TransportBridge';
import ConnectionToClient from '../lib/ConnectionToClient';

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
    test () {
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
