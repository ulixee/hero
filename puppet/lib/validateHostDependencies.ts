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
import { constants as FsConstants, promises as Fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import IBrowserEngine from '@secret-agent/interfaces/IBrowserEngine';
import { isDebianFlavor } from './LinuxUtils';
import DependencyInstaller from './DependencyInstaller';
import { DependenciesMissingError } from './DependenciesMissingError';

export async function validateHostRequirements(engine: IBrowserEngine): Promise<void> {
  const isWindows64 = os.platform() === 'win32' && os.arch() === 'x64';
  const isLinux = os.platform() === 'linux';

  if (!isLinux && !isWindows64) return;

  const installDirectory = path.dirname(engine.executablePath);
  const missingDeps = await findAllMissingDependencies(installDirectory);
  const isDebian = isLinux && (await isDebianFlavor());
  if (!missingDeps.size) {
    await DependencyInstaller.markValidated(engine);
    return;
  }

  const { name, fullVersion } = engine;
  const engineName = `${name[0].toUpperCase()}${name.slice(1)} ${fullVersion}`;

  let resolutionMessage: string;
  if (isWindows64) {
    resolutionMessage = getWindowsResolutionMessage(missingDeps);
  } else if (isDebian) {
    await DependencyInstaller.appendAptInstallNeeded(engine);
    resolutionMessage = `You can resolve this by running the apt dependency installer at:
-------------------------------------------------

${DependencyInstaller.aptScriptPath}

-------------------------------------------------

missing: ${[...missingDeps].join(', ')}
`;
  } else {
    resolutionMessage = `You need to install the following libraries: ${['', ...missingDeps].join(
      '\n    ',
    )}`;
  }
  throw new DependenciesMissingError(resolutionMessage, engineName, [...missingDeps]);
}

function getWindowsResolutionMessage(missingDeps: Set<string>): string {
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
      `Universal C Runtime files can't be found. You can fix that by installing Microsoft Visual C++ Redistributable for Visual Studio from:`,
      `https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads`,
      ``,
    );
  }

  if (isMediaFoundationMissing) {
    details.push(
      `Media Foundation files can't be found. If you're on Windows Server try fixing this by running the following command in PowerShell`,
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
  return details.join('\n');
}

async function findAllMissingDependencies(directoryPath: string): Promise<Set<string>> {
  const allPaths = (await Fs.readdir(directoryPath)).map(file => path.resolve(directoryPath, file));

  const missingDeps = await Promise.all(
    allPaths.map(async filePath => {
      const stat = await Fs.stat(filePath);
      if (!stat.isFile()) return [];

      const basename = path.basename(filePath).toLowerCase();
      if (basename.endsWith('.dll')) {
        return await spawnMissingDepsCheck(filePath);
      }

      try {
        await Fs.access(filePath, FsConstants.X_OK);
        return await spawnMissingDepsCheck(filePath);
      } catch (error) {
        // just break through and return if we can't access
      }
      return [];
    }),
  );

  return new Set<string>([].concat(...missingDeps));
}

async function spawnMissingDepsCheck(filePath: string): Promise<string[]> {
  let executable: string;
  if (process.platform === 'linux') executable = 'ldd';
  // NOTE: don't have a plan yet for how to include this exe (from playwright)
  if (process.platform === 'win32') executable = ''; // `bin/PrintDeps.exe`;

  if (!executable) return [];

  let stdout = '';
  let exitCode = 0;
  const spawned = spawn(executable, [filePath], {
    cwd: path.dirname(filePath),
    env: process.env,
  });
  spawned.stdout.setEncoding('utf8');
  spawned.stdout.on('data', data => (stdout += (data ?? '').toLowerCase()));

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
    .split(/\r?\n/g)
    .filter(line => line.trim().endsWith('not found') && line.includes('=>'))
    .map(line => line.split('=>')[0].trim());
}
