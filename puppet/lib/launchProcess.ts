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
import { Readable, Writable } from 'stream';
import * as readline from 'readline';
import * as Path from 'path';
import Log from '@secret-agent/commons/Logger';
import ILaunchedProcess from '@secret-agent/puppet-interfaces/ILaunchedProcess';
import { PipeTransport } from './PipeTransport';

const { log } = Log(module);

const logProcessExit = process.env.NODE_ENV !== 'test';

export default function launchProcess(
  executablePath: string,
  processArguments: string[],
  env: NodeJS.ProcessEnv,
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
    log.stats(`${exe}.stdout`, { message: line, sessionId: null });
  });

  const stderr = readline.createInterface({ input: launchedProcess.stderr });
  stderr.on('line', line => {
    log.warn(`${exe}.stderr`, { message: line, sessionId: null });
  });

  let processKilled = false;
  launchedProcess.once('exit', (exitCode, signal) => {
    processKilled = true;
    if (logProcessExit) {
      log.stats(`${exe}.ProcessExited`, { exitCode, signal, sessionId: null });
    }
  });

  const transport = new PipeTransport(
    launchedProcess.stdio[3] as Writable,
    launchedProcess.stdio[4] as Readable,
  );

  return Promise.resolve(<ILaunchedProcess>{
    transport,
    close,
  });

  function close(): Promise<void> {
    if (launchedProcess.killed || processKilled) return;

    try {
      const closed = new Promise<void>(resolve => launchedProcess.once('exit', resolve));
      if (process.platform === 'win32') {
        childProcess.execSync(`taskkill /pid ${launchedProcess.pid} /T /F`);
      } else {
        launchedProcess.kill('SIGKILL');
      }
      return closed;
    } catch (error) {
      // might have already been kill off
    }
  }
}
