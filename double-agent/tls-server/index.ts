import { EventEmitter } from 'events';
import { ChildProcess, fork } from 'child_process';
import Config from '@double-agent/config';
import parseTlsRecordFromStderr from './lib/parseTlsRecordFromStderr';
import ServerResponse from './lib/ServerResponse';
import IncomingMessage from './lib/IncomingMessage';
import IClientHello from './interfaces/IClientHello';

export default class TlsServer extends EventEmitter {
  private child: ChildProcess;
  private port: number;
  private openSslOutput: string;
  private activeRequest: { https?: any; clientHello?: IClientHello; isProcessing?: boolean } = {};
  private listenCallback: () => void;

  private readonly options: { key: Buffer; cert: Buffer };
  private readonly secureConnectionListener: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void>;

  constructor(
    options: { key: Buffer; cert: Buffer },
    secureConnectionListener: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
  ) {
    super();
    this.options = options;
    this.secureConnectionListener = secureConnectionListener;
  }

  public listen(port: number, callback?: () => void): void {
    this.port = port;
    this.listenCallback = callback;

    this.child = fork(`${__dirname}/child`, [], { stdio: ['ignore', 'inherit', 'pipe', 'ipc'] });
    this.child.stderr.setEncoding('utf8');

    this.child.on('error', (err) => {
      console.log('ERROR from tls child process', err);
      this.emit('error', err);
    });

    this.child.on('message', this.handleChildMessage.bind(this));
    this.child.stderr.on('data', this.handleOpenSslOutput.bind(this));

    this.child.send({
      start: { ...this.options, port },
    });
  }

  public close(): void {
    this.child.kill();
  }

  private emitRequest(): void {
    if (!this.activeRequest) return;
    if (!this.activeRequest.https) return;
    if (!this.activeRequest.clientHello) return;
    if (this.activeRequest.isProcessing) return;
    this.activeRequest.isProcessing = true;

    const req = new IncomingMessage({
      ...this.activeRequest.https,
      clientHello: this.activeRequest.clientHello,
    });
    const res = new ServerResponse(this.child, req);
    void this.secureConnectionListener(req, res);
  }

  private handleChildMessage(message: any): void {
    if (message.started) {
      if (this.listenCallback) this.listenCallback();
      return;
    }

    if (message.error) {
      this.emitError(message.error);
      return;
    }

    if (message.reset) {
      this.activeRequest = {};
      this.openSslOutput = '';
      return;
    }

    if (message.overloaded) {
      this.emit('overloaded');
      return;
    }

    if (message.favicon) {
      return;
    }

    if (message.request) {
      if (this.activeRequest.https) {
        return this.emitError('Found a conflicting https request');
      }
      this.activeRequest.https = message.request;
      this.emitRequest();
    }
  }

  private handleOpenSslOutput(message: string): void {
    if (this.activeRequest.isProcessing) return;
    if (Config.collect.tlsPrintRaw) {
      console.log('\n------RAW------\n%s\n\n', message);
    }
    this.openSslOutput += message;
    const messages = this.openSslOutput.split('\n\n');
    this.openSslOutput = messages.pop();
    if (this.activeRequest.clientHello) return;

    for (const str of messages) {
      try {
        const record = parseTlsRecordFromStderr(str);
        if ((record.header.content as any)?.type === 'ClientHello') {
          this.activeRequest.clientHello = record.header.content as IClientHello;
          this.emitRequest();
        }
      } catch (err) {
        this.emitError(err.message);
      }
    }
  }

  private emitError(message: string): void {
    this.emit('error', message);
    console.log(`ERROR: ${message}`);
  }

  static createServer(options, secureConnectionListener): TlsServer {
    return new TlsServer(options, secureConnectionListener);
  }
}
