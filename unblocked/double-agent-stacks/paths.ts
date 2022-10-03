import * as Path from 'path';
import * as Paths from './paths.json';

export const dataDir = Path.resolve(__dirname, Paths.data);

export const externalDataDir = Path.join(dataDir, 'external');
export const localDataDir = Path.join(dataDir, 'local');

export function getExternalDataPath(path: string): string {
  return Path.join(externalDataDir, path);
}

export function getLocalDataPath(path: string): string {
  return Path.join(localDataDir, path);
}
