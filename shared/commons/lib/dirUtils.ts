import * as Fs from 'fs';
import * as os from 'os';
import * as Path from 'path';
import { parseEnvPath } from './envUtils';
import { existsAsync } from './fileUtils';

export function getDataDirectory(): string {
  if (process.env.ULX_DATA_DIR) {
    return parseEnvPath(process.env.ULX_DATA_DIR);
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
