import * as os from 'os';
import * as Path from 'path';

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
