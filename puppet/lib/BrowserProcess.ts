import * as childProcess from 'child_process';
import { ChildProcess } from 'child_process';
import * as readline from 'readline';
import Log from '@ulixee/commons/lib/Logger';
import * as Fs from 'fs';
import IBrowserEngine from '@ulixee/hero-interfaces/IBrowserEngine';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { PipeTransport } from './PipeTransport';

const { log } = Log(module);

const logProcessExit = process.env.NODE_ENV !== 'test';

export default class BrowserProcess extends TypedEventEmitter<{ close: void }> {
  public readonly transport: PipeTransport;
  public hasLaunchError: Promise<Error>;
  private processKilled = false;
  private readonly launchedProcess: ChildProcess;

  constructor(private browserEngine: IBrowserEngine, private env?: NodeJS.ProcessEnv) {
    super();

    bindFunctions(this);
    this.launchedProcess = this.launch();
    this.bindProcessEvents();

    this.transport = new PipeTransport(this.launchedProcess);
    this.bindCloseHandlers();
  }

  async close(): Promise<void> {
    this.gracefulCloseBrowser();
    await this.killChildProcess();
  }

  private bindCloseHandlers(): void {
    process.once('exit', this.close);
    process.once('uncaughtExceptionMonitor', this.close);
    this.transport.onCloseFns.push(this.close);
  }

  private launch(): ChildProcess {
    const { name, executablePath, launchArguments } = this.browserEngine;
    log.info(`${name}.LaunchProcess`, { sessionId: null, executablePath, launchArguments });

    return childProcess.spawn(executablePath, launchArguments, {
      // On non-windows platforms, `detached: true` makes child process a
      // leader of a new process group, making it possible to kill child
      // process tree with `.kill(-pid)` command. @see
      // https://nodejs.org/api/child_process.html#child_process_options_detached
      detached: process.platform !== 'win32',
      env: this.env,
      stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'],
    });
  }

  private bindProcessEvents(): void {
    // Prevent Unhandled 'error' event.
    let error: Error;
    this.launchedProcess.on('error', e => {
      error = e;
    });
    if (!this.launchedProcess.pid) {
      this.hasLaunchError = new Promise<Error>(resolve => {
        if (error) return resolve(error);
        this.launchedProcess.once('error', err => {
          resolve(new Error(`Failed to launch browser: ${err}`));
        });
      });
    }
    const { stdout, stderr } = this.launchedProcess;
    const name = this.browserEngine.name;

    readline.createInterface({ input: stdout }).on('line', line => {
      if (line) log.stats(`${name}.stdout`, { message: line, sessionId: null });
    });
    readline.createInterface({ input: stderr }).on('line', line => {
      if (line) log.warn(`${name}.stderr`, { message: line, sessionId: null });
    });

    this.launchedProcess.once('exit', this.onChildProcessExit);
  }

  private gracefulCloseBrowser(): void {
    try {
      // attempt graceful close, but don't wait
      if (this.transport && !this.transport.isClosed) {
        this.transport.send(JSON.stringify({ method: 'Browser.close', id: -1 }));
        this.transport.close();
      }
    } catch (e) {
      // this might fail, we want to keep going
    }
  }

  private async killChildProcess(): Promise<void> {
    const launchedProcess = this.launchedProcess;
    try {
      if (!launchedProcess.killed && !this.processKilled) {
        const closed = new Promise<void>(resolve => launchedProcess.once('exit', resolve));
        if (process.platform === 'win32') {
          childProcess.execSync(`taskkill /pid ${launchedProcess.pid} /T /F 2> nul`);
        } else {
          launchedProcess.kill('SIGKILL');
        }
        launchedProcess.emit('exit');
        await closed;
      }
    } catch (e) {
      // might have already been kill off
    }
  }

  private onChildProcessExit(exitCode: number, signal: NodeJS.Signals): void {
    if (this.processKilled) return;
    this.processKilled = true;

    try {
      this.transport?.close();
    } catch (e) {
      // drown
    }
    if (logProcessExit) {
      const name = this.browserEngine.name;
      log.stats(`${name}.ProcessExited`, { exitCode, signal, sessionId: null });
    }

    this.emit('close');
    this.removeAllListeners();
    this.cleanDataDir();
  }

  private cleanDataDir(retries = 3): void {
    const datadir = this.browserEngine.userDataDir;
    if (!datadir) return;
    try {
      if (Fs.existsSync(datadir)) {
        // rmdir is deprecated in node 16+
        const fn = 'rmSync' in Fs ? 'rmSync' : 'rmdirSync';
        Fs[fn](datadir, { recursive: true });
      }
    } catch (err) {
      if (retries >= 0) {
        this.cleanDataDir(retries - 1);
      }
    }
  }
}
