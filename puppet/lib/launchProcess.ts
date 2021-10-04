/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as childProcess from 'child_process';
import { StdioOptions } from 'child_process';
import * as readline from 'readline';
import * as Path from 'path';
import Log from '@ulixee/commons/lib/Logger';
import ILaunchedProcess from '@ulixee/hero-interfaces/ILaunchedProcess';
import * as Fs from 'fs';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import { PipeTransport } from './PipeTransport';

const { log } = Log(module);

const logProcessExit = process.env.NODE_ENV !== 'test';

export default function launchProcess(
  executablePath: string,
  processArguments: string[],
  onClose?: () => any,
  env?: NodeJS.ProcessEnv,
): Promise<ILaunchedProcess> {
  const stdio: StdioOptions = ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'];

  log.info(`Puppet.LaunchProcess`, { sessionId: null, executablePath, processArguments });
  const launchedProcess = childProcess.spawn(executablePath, processArguments, {
    // On non-windows platforms, `detached: true` makes child process a
    // leader of a new process group, making it possible to kill child
    // process tree with `.kill(-pid)` command. @see
    // https://nodejs.org/api/child_process.html#child_process_options_detached
    detached: process.platform !== 'win32',
    env,
    stdio,
  });

  // Prevent Unhandled 'error' event.
  launchedProcess.on('error', () => {});

  if (!launchedProcess.pid) {
    return new Promise<ILaunchedProcess>((resolve, reject) => {
      launchedProcess.once('error', error => {
        reject(new Error(`Failed to launch browser: ${error}`));
      });
    });
  }

  let exe = executablePath.split(Path.sep).pop().toLowerCase();
  exe = exe[0].toUpperCase() + exe.slice(1);

  const stdout = readline.createInterface({ input: launchedProcess.stdout });
  stdout.on('line', line => {
    if (line) log.stats(`${exe}.stdout`, { message: line, sessionId: null });
  });

  const stderr = readline.createInterface({ input: launchedProcess.stderr });
  stderr.on('line', line => {
    if (!line) return;

    log.warn(`${exe}.stderr`, { message: line, sessionId: null });
  });

  let hasRunOnClose = false;
  const runOnClose = () => {
    if (hasRunOnClose) return;
    if (onClose) onClose();
    hasRunOnClose = true;
  };
  const dataDir = processArguments
    .find(x => x.startsWith('--user-data-dir='))
    ?.split('--user-data-dir=')
    ?.pop();

  let processKilled = false;
  let transport: PipeTransport;
  launchedProcess.once('exit', (exitCode, signal) => {
    processKilled = true;

    try {
      transport?.close();
    } catch (error) {
      // drown
    }
    if (logProcessExit) {
      log.stats(`${exe}.ProcessExited`, { exitCode, signal, sessionId: null });
    }
    runOnClose();
    if (dataDir) cleanDataDir(dataDir);
  });

  process.once('exit', close);
  process.once('uncaughtExceptionMonitor', close);
  ShutdownHandler.register(close);
  const { 3: pipeWrite, 4: pipeRead } = launchedProcess.stdio;
  transport = new PipeTransport(
    pipeWrite as NodeJS.WritableStream,
    pipeRead as NodeJS.ReadableStream,
  );
  transport.onCloseFns.push(close);

  return Promise.resolve(<ILaunchedProcess>{
    transport,
    close,
  });

  async function close(): Promise<void> {
    try {
      // attempt graceful close, but don't wait
      if (transport) {
        transport.end(JSON.stringify({ method: 'Browser.close', id: -1 }));
      }
    } catch (error) {
      // this might fail, we want to keep going
    }

    try {
      if (!launchedProcess.killed && !processKilled) {
        const closed = new Promise<void>(resolve => launchedProcess.once('exit', resolve));
        if (process.platform === 'win32') {
          childProcess.execSync(`taskkill /pid ${launchedProcess.pid} /T /F 2> nul`);
        } else {
          launchedProcess.kill('SIGKILL');
        }
        launchedProcess.emit('exit');
        await closed;
      }
    } catch (error) {
      // might have already been kill off
    }
  }

  function cleanDataDir(datadir: string, retries = 3): void {
    try {
      if (Fs.existsSync(datadir)) {
        // rmdir is deprecated in node 16+
        const fn = 'rmSync' in Fs ? 'rmSync' : 'rmdirSync';
        Fs[fn](dataDir, { recursive: true });
      }
    } catch (err) {
      if (retries >= 0) {
        cleanDataDir(datadir, retries - 1);
      }
    }
  }
}
