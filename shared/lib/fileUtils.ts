import { promises as Fs } from 'fs';
import * as Os from 'os';
import * as crypto from 'crypto';

export async function existsAsync(path: string): Promise<boolean> {
  try {
    await Fs.access(path);
    return true;
  } catch (_) {
    return false;
  }
}

export async function readFileAsJson<T>(path: string): Promise<T> {
  const buffer = await Fs.readFile(path, 'utf8');
  return JSON.parse(buffer) as T;
}

// Nodejs doesn't guarantee it will complete writing to the file if multiple processes are writing and/or the process shuts down.
export async function safeOverwriteFile(path: string, body: any): Promise<void> {
  if (await existsAsync(path)) {
    const tempId = crypto.randomBytes(16).toString('hex');
    const tmpPath = `${path}.${tempId}`;
    await Fs.writeFile(tmpPath, body);
    await Fs.rename(tmpPath, path);
  } else {
    await Fs.writeFile(path, body);
  }
}

const homeDirReplace = new RegExp(Os.homedir(), 'g');

export function cleanHomeDir(str: string): string {
  return str.replace(homeDirReplace, '~');
}
