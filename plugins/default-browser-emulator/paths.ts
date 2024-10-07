import * as Path from 'path';
import * as Paths from './paths.json';

let PathsLocal;
try {
  // eslint-disable-next-line import/no-unresolved
  PathsLocal = require('./paths.local.json');
} catch {
  PathsLocal = {};
}

const PathsMerged = {
  ...Paths,
  ...PathsLocal,
};

export const emulatorDataDir = Path.resolve(__dirname, PathsMerged['emulator-data']);
