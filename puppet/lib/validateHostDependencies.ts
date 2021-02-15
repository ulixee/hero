/**
 * Copyright (c) Microsoft Corporation.
 * Modifications copyright (c) Data Liberation Foundation Inc.
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { constants as FsConstants, promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

// COPIED from https://github.com/microsoft/playwright/blob/b09e0d01bd9dc73024a8c8d458cd115f1e9e11a6/src/server/validateDependencies.ts
export async function validateHostRequirements(browserPath: string) {
  const canValidate = os.platform() === 'win32' && os.arch() === 'x64';
  if (!canValidate) return;

  const missingDeps = await findAllMissingDependencies(path.dirname(browserPath));
  if (!missingDeps.size) return;

  let isCrtMissing = false;
  let isMediaFoundationMissing = false;
  for (const dep of missingDeps) {
    if (dep.startsWith('api-ms-win-crt') || dep === 'vcruntime140.dll' || dep === 'msvcp140.dll')
      isCrtMissing = true;
    else if (
      dep === 'mf.dll' ||
      dep === 'mfplat.dll' ||
      dep === 'msmpeg2vdec.dll' ||
      dep === 'evr.dll' ||
      dep === 'avrt.dll'
    )
      isMediaFoundationMissing = true;
  }

  const details: string[] = [];

  if (isCrtMissing) {
    details.push(
      `Some of the Universal C Runtime files cannot be found on the system. You can fix`,
      `that by installing Microsoft Visual C++ Redistributable for Visual Studio from:`,
      `https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads`,
      ``,
    );
  }

  if (isMediaFoundationMissing) {
    details.push(
      `Some of the Media Foundation files cannot be found on the system. If you are`,
      `on Windows Server try fixing this by running the following command in PowerShell`,
      `as Administrator:`,
      ``,
      `    Install-WindowsFeature Server-Media-Foundation`,
      ``,
      `For Windows N editions visit:`,
      `https://support.microsoft.com/en-us/help/3145500/media-feature-pack-list-for-windows-n-editions`,
      ``,
    );
  }

  details.push(`Full list of missing libraries:`, `    ${[...missingDeps].join('\n    ')}`, ``);

  // eslint-disable-next-line no-console
  console.warn(`Host system is missing dependencies!\n\n${details.join('\n')}`);
}

async function findAllMissingDependencies(directoryPath: string): Promise<Set<string>> {
  const allPaths = (await fs.readdir(directoryPath)).map(file => path.resolve(directoryPath, file));

  const missingDeps = await Promise.all(
    allPaths.map(async filePath => {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) return [];

      const basename = path.basename(filePath).toLowerCase();
      if (basename.endsWith('.dll')) {
        return await spawnMissingDepsExe(filePath);
      }

      const canAccess = await fs.access(filePath, FsConstants.X_OK).catch(() => false);
      if (canAccess) {
        return await spawnMissingDepsExe(filePath);
      }
      return [];
    }),
  );

  return new Set<string>(...[].concat(...missingDeps));
}

async function spawnMissingDepsExe(filePath: string): Promise<string[]> {
  const executable = `bin/PrintDeps.exe`; // TODO: if we keep this, need to get a path to it
  if (!executable) return [];

  let stdout = '';
  let exitCode = 0;
  const spawned = spawn(executable, [filePath], {
    cwd: path.dirname(filePath),
    env: process.env,
  });
  spawned.stdout.on('data', data => (stdout += data.toLowerCase()));

  await new Promise<void>(resolve => {
    spawned.once('close', code => {
      exitCode = code;
      resolve();
    });
    spawned.once('error', resolve);
  });
  if (exitCode !== 0) {
    return [];
  }

  return stdout
    .split(/\r?\n/)
    .filter(line => line.trim().endsWith('not found') && line.includes('=>'))
    .map(line => line.split('=>')[0].trim());
}
