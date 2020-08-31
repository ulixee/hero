import CoreServer from '@secret-agent/core-server';
import JsonSocket from 'json-socket';
import Net from 'net';

export default class SecretAgentSocketServer {
  private readonly port: number;
  private readonly proxyPort: number;
  private readonly coreServer: CoreServer = new CoreServer();
  private netServer: Net.Server;
  private netConnectionsById: { [id: string]: Net.Socket } = {};
  private lastConnectionId = 0;

  constructor(config: { ip?: string, port: number, proxyPort?: number }) {
    this.port = config.port;
    this.proxyPort = config.proxyPort;
  }

  public listen(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.netServer = Net.createServer(this.handleNetConnection.bind(this));
      this.netServer.on('error', error => reject(error));
      this.netServer.listen(this.port, () => resolve());
    });
  }

  public close() {
    return new Promise(resolve => {
      try {
        const promises = Object.values(this.netConnectionsById).map(netSocket => netSocket.end());
        this.netServer.close(async () => {
          await Promise.all(promises);
          setTimeout(resolve, 0);
        });
      } catch (err) {
        console.error('Error closing socket connections', err);
        resolve();
      }
    });
  }

  private async handleNetConnection(netConnection: Net.Socket) {
    const jsonSocket = new JsonSocket(netConnection);
    const coreConnection = this.coreServer.addConnection(netConnection);
    const id = (this.lastConnectionId += 1).toString();

    this.netConnectionsById[id] = netConnection;

    coreConnection.pipeOutgoing(async payload => jsonSocket.write(payload));
    jsonSocket.on('message', payload => coreConnection.pipeIncoming(payload));
    jsonSocket.on('end', () => {
      delete this.netConnectionsById[id];
      coreConnection.close();
    });
  }
}
