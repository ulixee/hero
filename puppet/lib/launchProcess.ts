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
import * as childProcess from "child_process";
import { StdioOptions } from "child_process";
import { debug } from "@secret-agent/commons/Debug";
import { Readable, Writable } from "stream";
import * as readline from "readline";
import Path from 'path';
import { PipeTransport } from "./PipeTransport";
import ILaunchedProcess from "../interfaces/ILaunchedProcess";

const debugLauncher = debug('puppet:launcher');

export default function launchProcess(
  executablePath: string,
  processArguments: string[],
  env: NodeJS.ProcessEnv,
  pipeIo = true,
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
  if (!launchedProcess.pid) {
    launchedProcess.once('error', debugLauncher);
    throw new Error('Failed to launch');
  }

  const exe = executablePath.split(Path.sep).pop().toLowerCase();
  const errorDebug = debug(`${exe}:stderr`);
  const outDebug = debug(`${exe}:stdout`);
  if (pipeIo) {
    const stdout = readline.createInterface({ input: launchedProcess.stdout });
    stdout.on('line', (data: string) => {
      outDebug(data);
    });

    const stderr = readline.createInterface({ input: launchedProcess.stderr });
    stderr.on('line', (data: string) => {
      errorDebug(data);
    });
  }
  let processKilled = false;
  launchedProcess.once('exit', (exitCode, signal) => {
    processKilled = true;
    outDebug(`<process did exit: exitCode=${exitCode}, signal=${signal}>`);
  });

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
    if (launchedProcess.killed || processKilled) return;

    try {
      if (process.platform === 'win32') {
        childProcess.execSync(`taskkill /pid ${launchedProcess.pid} /T /F`);
      } else {
        launchedProcess.kill('SIGKILL');
      }
    } catch (error) {
      // might have already been kill off
    }
  }
}
