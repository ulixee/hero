import * as Http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import IReplayMeta from '~shared/interfaces/IReplayMeta';
import ReplayApi from '~backend/api/index';

export default class ScriptRegistrationServer {
  private server: Http.Server;
  private readonly registerReplayMeta: (replayMeta: IReplayMeta) => any;

  constructor(registerReplayMeta: (replayMeta: IReplayMeta) => any) {
    this.registerReplayMeta = registerReplayMeta;
    this.server = new Http.Server(this.handleRequest.bind(this));
    this.server.listen(0, () => {
      const port = (this.server.address() as AddressInfo).port;
      console.error(`REPLAY REGISTRATION API [http://localhost:${port}]`);
    });
  }

  public close() {
    this.server.close();
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse) {
    let data = '';
    for await (const chunk of request) {
      data += chunk.toString();
    }

    const meta: IReplayMeta & { apiStartPath: string; nodePath: string } = JSON.parse(data);
    console.log('ScriptInstance Registered', meta);

    ReplayApi.serverStartPath = meta.apiStartPath;
    ReplayApi.nodePath = meta.nodePath;
    this.registerReplayMeta(meta);
    response.writeHead(200);
    response.end();
  }
}
