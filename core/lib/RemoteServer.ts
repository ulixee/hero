import JsonSocket from 'json-socket';
import Net, { AddressInfo, NetConnectOpts } from 'net';
import Log from '@secret-agent/commons/Logger';
import Core from '../index';

const { log } = Log(module);

export default class RemoteServer {
  public get port() {
    return (this.netServer.address() as AddressInfo).port;
  }

  private readonly netServer: Net.Server;
  private netConnectionsById: { [id: string]: Net.Socket } = {};
  private lastConnectionId = 0;

  constructor() {
    this.netServer = Net.createServer(this.handleNetConnection.bind(this));
  }

  public listen(options: NetConnectOpts): Promise<AddressInfo> {
    return new Promise<AddressInfo>((resolve, reject) => {
      this.netServer.on('error', reject);
      this.netServer.listen(options, () => {
        this.netServer.off('error', reject);
        resolve(this.netServer.address() as AddressInfo);
      });
    });
  }

  public close(): Promise<void> {
    return new Promise<void>(resolve => {
      try {
        const promises = Object.values(this.netConnectionsById).map(netSocket => netSocket.end());
        this.netServer.close(async () => {
          await Promise.all(promises);
          setImmediate(resolve);
        });
      } catch (error) {
        log.error('Error closing socket connections', {
          error,
          sessionId: null,
        });
        resolve();
      }
    });
  }

  private handleNetConnection(netConnection: Net.Socket): void {
    const jsonSocket = new JsonSocket(netConnection);
    const coreConnection = Core.addConnection();
    const id = (this.lastConnectionId += 1).toString();

    this.netConnectionsById[id] = netConnection;

    coreConnection.on('message', payload => {
      jsonSocket.sendMessage(payload, error => {
        if (error) {
          log.error('Error sending message', {
            error,
            sessionId: null,
          });
          jsonSocket.destroy(error);
        }
      });
    });
    jsonSocket.on('message', payload => coreConnection.handleRequest(payload));

    jsonSocket.on('end', () => {
      delete this.netConnectionsById[id];
      coreConnection.disconnect();
    });
  }
}
