import * as os from 'os';
import * as Path from 'path';
import * as Fs from 'fs';
import { existsAsync } from './fileUtils';

export function getCacheDirectory(): string {
  if (process.platform === 'linux') {
    return process.env.XDG_CACHE_HOME || Path.join(os.homedir(), '.cache');
  }

  if (process.platform === 'darwin') {
    return Path.join(os.homedir(), 'Library', 'Caches');
  }

  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA || Path.join(os.homedir(), 'AppData', 'Local');
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
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
