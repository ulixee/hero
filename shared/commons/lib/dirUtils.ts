import * as Fs from 'fs';
import * as os from 'os';
import * as Path from 'path';
import { fileURLToPath } from 'url';
import { parseEnvPath } from './envUtils';
import { existsAsync } from './fileUtils';

export function getDirname(dirnameOrUrl: string): string {
  if (typeof dirnameOrUrl === 'string') {
    // handle file:// urls like import.meta.url
    if (dirnameOrUrl.startsWith('file://')) {
      const filename = fileURLToPath(dirnameOrUrl);
      return Path.dirname(filename);
    }
    return dirnameOrUrl;
  }
  throw new Error('Invalid argument passed to getDirname');
}

export function getSourcedir(dirnameOrUrl: string, buildDir = 'build'): string | null {
  const dirname = getDirname(dirnameOrUrl);
  let rootBuildDir = dirname;
  while (!rootBuildDir.endsWith(`${Path.sep}${buildDir}`)) {
    rootBuildDir = Path.dirname(rootBuildDir);
    if (!rootBuildDir || rootBuildDir === Path.sep) {
      return null;
    }
  }
  const relativePath = Path.relative(rootBuildDir, dirname);
  return Path.join(buildDir, '..', relativePath);
}

export function getClosestPackageJson(path: string): any | undefined {
  while (!Fs.existsSync(Path.join(path, 'package.json'))) {
    const next = Path.dirname(path);
    if (next === path || !next) {
      return null;
    }
    path = next;
  }
  return JSON.parse(Fs.readFileSync(Path.join(path, 'package.json'), 'utf8'));
}

export function getDataDirectory(): string {
  if (process.env.ULX_DATA_DIR) {
    const envPath = parseEnvPath(process.env.ULX_DATA_DIR);
    if (envPath) return envPath;
  }
  if (process.platform === 'linux') {
    return process.env.XDG_DATA_HOME || Path.join(os.homedir(), '.local', 'share');
  }

  if (process.platform === 'darwin') {
    return Path.join(os.homedir(), 'Library', 'Application Support');
  }

  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA || Path.join(os.homedir(), 'AppData', 'Local');
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

const homeDirReplace = new RegExp(os.homedir(), 'g');

export function cleanHomeDir(str: string): string {
  return str.replace(homeDirReplace, '~');
}

export function findProjectPathSync(startingDirectory: string): string {
  let last: string;
  let path = Path.resolve(startingDirectory);
  do {
    last = path;
    if (Fs.existsSync(Path.join(path, 'package.json'))) {
      return path;
    }
    path = Path.dirname(path);
  } while (path && path !== last);
  return path;
}

export async function findProjectPathAsync(startingDirectory: string): Promise<string> {
  let last: string;
  let path = Path.resolve(startingDirectory);
  do {
    last = path;
    if (await existsAsync(Path.join(path, 'package.json'))) {
      return path;
    }
    path = Path.dirname(path);
  } while (path && path !== last);
  return path;
}
