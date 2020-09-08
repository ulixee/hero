import path from 'path';
import os from 'os';
import { BrowserFetcher } from './BrowserFetcher';

export function getExecutablePath(browser: string, revision: string) {
  const browserFetcher = new BrowserFetcher({
    path: getInstallDirectory(browser, revision),
  });
  const revisionInfo = browserFetcher.revisionInfo(revision);
  return revisionInfo.executablePath;
}

export function getInstallDirectory(browser: string, revision: string) {
  return `${getCacheDirectory()}/${browser}-${revision}`;
}

function getCacheDirectory() {
  if (process.platform === 'linux') {
    return process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  }

  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches');
  }

  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}
