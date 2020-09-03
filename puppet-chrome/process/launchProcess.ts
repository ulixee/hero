/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import * as removeFolder from 'rimraf';
import { debug } from '@secret-agent/commons/Debug';
import { Readable, Writable } from 'stream';
import { Connection } from './Connection';
import { PipeTransport } from './PipeTransport';
import { ILaunchOptions } from '../interfaces/ILaunchOptions';

const debugLauncher = debug('puppet-chrome:launcher');
const PROCESS_ERROR_EXPLANATION = `SecretAgent was unable to kill the process which ran this browser binary.
On future SecretAgent launches, SecretAgent might not be able to launch the browser.
Please check your open processes and ensure that the browser processes that SecretAgent launched have been killed.
If you think this is a bug, please report it on the SecretAgent issue tracker.`;

export default function launchProcess(
  processArguments: string[],
  tempDirectory: string,
  launchOptions: ILaunchOptions,
): ILaunchedProcess {
  const { dumpio, env, executablePath } = launchOptions;
  const stdio: StdioOptions = ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'];
  if (!dumpio) {
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

  if (dumpio) {
    launchedProcess.stderr.pipe(process.stderr);
    launchedProcess.stdout.pipe(process.stdout);
  }

  let isCleanedUp = false;
  function cleanup() {
    if (isCleanedUp) return;
    isCleanedUp = true;
    removeFolder.sync(tempDirectory);
  }
  launchedProcess.once('exit', cleanup.bind(this));
  process.once('exit', close.bind(this));

  const transport = new PipeTransport(
    launchedProcess.stdio[3] as Writable,
    launchedProcess.stdio[4] as Readable,
  );
  const connection = new Connection(transport);

  return {
    connection,
    close,
  } as ILaunchedProcess;

  function close() {
    cleanup();

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

interface ILaunchedProcess {
  connection: Connection;
  kill: () => void;
  close: () => void;
}
