import { ChildProcess } from 'child_process';
import { IncomingHttpHeaders } from 'http';

export default class ServerResponse {
  private readonly child: ChildProcess;
  private readonly connectionId: string;

  constructor(child, { connectionId }: { connectionId: string }) {
    this.child = child;
    this.connectionId = connectionId;
  }

  writeHead(status: number, headers: IncomingHttpHeaders): void {
    console.log('TlS Server Issues!', status, headers);
  }

  end(body?: string): void {
    this.child.send({
      response: {
        connectionId: this.connectionId,
        body,
      },
    });
  }
}
