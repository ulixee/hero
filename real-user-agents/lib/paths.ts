import * as Path from 'path';

const Paths = require('../paths.json');

let PathsLocal;
try {
  // eslint-disable-next-line import/no-unresolved
  PathsLocal = require('../paths.local.json');
} catch {
  PathsLocal = {};
}

const PathsMerged = {
  ...Paths,
  ...PathsLocal,
};

export const dataDir = Path.resolve(__dirname, '..', PathsMerged.data);

export function getDataFilePath(path: string): string {
  return Path.join(dataDir, path);
}
