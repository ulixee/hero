import { ChildProcess, spawn } from 'child_process';
import * as os from 'os';
import Log from '@ulixee/commons/Logger';
import * as net from 'net';
import { unlink } from 'fs';
import Resolvable from '@ulixee/commons/Resolvable';
import { IBoundLog } from '@ulixee/hero-interfaces/ILog';
import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import { bindFunctions } from '@ulixee/commons/utils';
import { createId, createIpcSocketPath } from '@ulixee/commons/IpcUtils';
import * as Fs from 'fs';
import * as Path from 'path';

const ext = os.platform() === 'win32' ? '.exe' : '';
const libPath = Path.join(__dirname, '/../dist/', `connect${ext}`);

const distExists = Fs.existsSync(libPath);

const { log } = Log(module);

export default abstract class BaseIpcHandler {
  public isClosing: boolean;
  public get waitForConnected(): Promise<void> {
    this.hasWaitListeners = true;
    return this.waitForConnect.promise;
  }

  public get pid(): number | undefined {
    return this.child?.pid;
  }

  protected abstract logger: IBoundLog;
  protected options: IGoIpcOpts;

  private hasWaitListeners = false;
  private waitForConnect = new Resolvable<void>();
  private child: ChildProcess;
  private readonly ipcServer = new net.Server();
  private ipcSocket: net.Socket;
  private isExited = false;

  private pendingMessage = '';

  private readonly handlerName: string;

  protected constructor(options: Partial<IGoIpcOpts>) {
    this.options = this.getDefaultOptions(options);

    if (!distExists) {
      throw new Error(`Required files missing! The MitmSocket library was not found at ${libPath}`);
    }

    const mode = this.options.mode;
    this.handlerName = `${mode[0].toUpperCase() + mode.slice(1)}IpcHandler`;

    bindFunctions(this);

    unlink(this.options.ipcSocketPath, () => {
      this.ipcServer.listen(this.options.ipcSocketPath);
      this.spawnChild();
    });
    this.ipcServer.once('connection', this.onIpcConnection.bind(this));
  }

  public close(): void {
    if (this.isClosing) return;
    const parentLogId = this.logger.info(`${this.handlerName}.Closing`);
    this.isClosing = true;

    if (this.child) {
      try {
        // fix for node 13 throwing errors on closed sockets
        this.child.stdin.on('error', () => {
          // catch
        });
        // NOTE: windows writes to stdin
        // MUST SEND SIGNALS BEFORE DISABLING PIPE!!
        this.child.send('disconnect');
      } catch (err) {
        // don't log epipes
      }

      this.child.kill('SIGINT');
      this.child.unref();
    }

    try {
      this.onExit();
    } catch (err) {
      // don't log cleanup issue
    }

    if (!this.waitForConnect.isResolved && this.hasWaitListeners) {
      this.waitForConnect.reject(new CanceledPromiseError('Canceling ipc connect'));
    }
    this.logger.stats(`${this.handlerName}.Closed`, {
      parentLogId,
    });
  }

  protected abstract onMessage(message: string): void;
  protected abstract beforeExit(): void;

  protected async sendIpcMessage(message: any): Promise<void> {
    await this.waitForConnect.promise;
    await new Promise<void>((resolve, reject) => {
      this.ipcSocket.write(`${JSON.stringify(message)}\n`, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private onIpcConnection(socket: net.Socket): void {
    this.ipcSocket = socket;
    this.ipcSocket.on('data', this.onIpcData.bind(this));
    this.ipcSocket.on('error', err => {
      // wait a sec to see if we're shutting down
      setImmediate(error => {
        if (!this.isClosing && !this.isExited)
          this.logger.error(`${this.handlerName}.error`, { error });
      }, err);
    });

    this.waitForConnect.resolve();
  }

  private onExit(): void {
    if (this.isExited) return;
    this.isExited = true;
    this.beforeExit();

    this.ipcServer.unref().close(() => {
      unlink(this.options.ipcSocketPath, () => null);
    });
    if (this.ipcSocket) {
      this.ipcSocket.unref().end();
    }
  }

  private onError(error: Error): void {
    if (this.isClosing) return;
    this.logger.error(`${this.handlerName}.onError`, {
      error,
    });
  }

  private onIpcData(buffer: Buffer): void {
    if (this.isClosing) return;
    let end = buffer.indexOf('\n');
    if (end === -1) {
      this.pendingMessage += buffer.toString();
      return;
    }
    const message = this.pendingMessage + buffer.toString(undefined, 0, end);
    this.onMessage(message);

    let start = end + 1;
    end = buffer.indexOf('\n', start);
    while (end !== -1) {
      this.onMessage(buffer.toString(undefined, start, end));
      start = end + 1;
      end = buffer.indexOf('\n', start);
    }
    this.pendingMessage = buffer.toString(undefined, start);
  }

  private onChildProcessMessage(message: string): void {
    if (this.isClosing) return;
    this.logger.info(`${this.handlerName}.stdout: ${message}`);
  }

  private onChildProcessStderr(message: string): void {
    if (this.isClosing) return;
    this.logger.info(`${this.handlerName}.stderr: ${message}`);
  }

  private spawnChild(): void {
    if (this.isClosing) return;
    const options = this.options;
    this.child = spawn(libPath, [JSON.stringify(options)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      cwd: options.storageDir,
    });
    const child = this.child;
    child.on('exit', this.onExit);
    child.on('error', this.onError);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', this.onChildProcessMessage);
    child.stderr.on('data', this.onChildProcessStderr);
  }

  private getDefaultOptions(options: Partial<IGoIpcOpts>): IGoIpcOpts {
    options.debug ??= log.level === 'stats';
    const mode = options.mode || 'proxy';
    options.mode = mode;

    if (options.ipcSocketPath === undefined) {
      const id = createId();
      options.ipcSocketPath = createIpcSocketPath(`ipc-${mode}-${id}`);
    }
    return options as IGoIpcOpts;
  }
}

export interface IGoIpcOpts {
  mode?: 'certs' | 'proxy';
  storageDir?: string;
  ipcSocketPath?: string;
  clientHelloId?: string;
  tcpTtl?: number;
  tcpWindowSize?: number;
  rejectUnauthorized?: boolean;
  debug?: boolean;
  debugData?: boolean; // include bytes read from client/remote (NOTE: lots of output)
}
