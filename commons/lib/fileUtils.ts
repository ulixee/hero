import { promises as Fs } from 'fs';
import * as Os from 'os';
import * as crypto from 'crypto';
import TypeSerializer from './TypeSerializer';

export async function existsAsync(path: string): Promise<boolean> {
  try {
    await Fs.access(path);
    return true;
  } catch (_) {
    return false;
  }
}

export async function copyDir(fromDir: string, toDir: string): Promise<void> {
  await Fs.mkdir(toDir, { recursive: true });
  for (const file of await Fs.readdir(fromDir, { withFileTypes: true })) {
    const path = `${fromDir}/${file.name}`;
    if (file.isDirectory()) await copyDir(path, `${toDir}/${file.name}`);
    else await Fs.copyFile(path, `${toDir}/${file.name}`);
  }
}

export async function readFileAsJson<T>(path: string): Promise<T | null> {
  const buffer = await Fs.readFile(path, 'utf8').catch(() => null);
  if (!buffer) return null;
  return TypeSerializer.parse(buffer) as T;
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
