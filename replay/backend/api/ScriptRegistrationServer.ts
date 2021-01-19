import * as Http from 'http';
import * as Fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import IReplayMeta from '~shared/interfaces/IReplayMeta';
import ReplayApi from '~backend/api/index';
import { getInstallDirectory } from '~install/Utils';

const apiPath = `${getInstallDirectory()}/api.txt`;

export default class ScriptRegistrationServer {
  private server: Http.Server;
  private readonly registerReplayMeta: (replayMeta: IReplayMeta) => any;

  constructor(registerReplayMeta: (replayMeta: IReplayMeta) => any) {
    this.registerReplayMeta = registerReplayMeta;
    this.server = new Http.Server(this.handleRequest.bind(this));
    this.server.listen(0, () => {
      const port = (this.server.address() as AddressInfo).port;
      console.log('ScriptRegistrationServer.started', port);
      Fs.writeFileSync(apiPath, Buffer.from(`http://localhost:${port}`));
    });
  }

  public close() {
    Fs.writeFileSync(apiPath, '');
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
