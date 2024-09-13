import * as Path from 'path';

const Paths = require('../paths.json');

export const dataDir = Path.resolve(__dirname, '..', Paths.data);

export function getDataFilePath(path: string): string {
  return Path.join(dataDir, path);
}
