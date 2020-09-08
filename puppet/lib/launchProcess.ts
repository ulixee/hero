import * as childProcess from 'child_process';
import { StdioOptions } from 'child_process';
import { debug } from '@secret-agent/commons/Debug';
import { Readable, Writable } from 'stream';
import { PipeTransport } from './PipeTransport';
import ILaunchedProcess from "../interfaces/ILaunchedProcess";

const debugLauncher = debug('puppet:launcher');
const PROCESS_ERROR_EXPLANATION = `SecretAgent was unable to kill the process which ran this browser binary.
On future SecretAgent launches, SecretAgent might not be able to launch the browser.
Please check your open processes and ensure that the browser processes that SecretAgent launched have been killed.
If you think this is a bug, please report it on the SecretAgent issue tracker.`;

export default function launchProcess(
  executablePath: string,
  processArguments: string[],
  env: NodeJS.ProcessEnv,
  pipeIo = false,
) {
  const stdio: StdioOptions = ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'];
  if (!pipeIo) {
    stdio[1] = 'ignore';
    stdio[2] = 'ignore';
  }

  debugLauncher(`Calling ${executablePath} ${processArguments.join(' ')}`);
  const launchedProcess = childProcess.spawn(executablePath, processArguments, {
    // On non-windows platforms, `detached: true` makes child process a
    // leader of a new process group, making it possible to kill child
    // process tree with `.kill(-pid)` command. @see
    // https://nodejs.org/api/child_process.html#child_process_options_detached
    detached: process.platform !== 'win32',
    env,
    stdio,
  });

  if (pipeIo) {
    launchedProcess.stderr.pipe(process.stderr);
    launchedProcess.stdout.pipe(process.stdout);
  }

  process.once('exit', close.bind(this));

  const transport = new PipeTransport(
    launchedProcess.stdio[3] as Writable,
    launchedProcess.stdio[4] as Readable,
  );

  return {
    transport,
    close,
  } as ILaunchedProcess;

  function close() {
    if (launchedProcess.killed) return;

    try {
      if (process.platform === 'win32') {
        childProcess.execSync(`taskkill /pid ${launchedProcess.pid} /T /F`);
      } else {
        launchedProcess.kill('SIGKILL');
      }
    } catch (error) {
      throw new Error(`${PROCESS_ERROR_EXPLANATION}\nError cause: ${error.stack}`);
    }
  }
}
