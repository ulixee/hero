import * as Path from 'path';
import * as Fs from 'fs';
import * as os from 'os';
import * as Semver from 'semver';

const packageJson = require('../package.json');

const { version } = packageJson;

export function getInstallDirectory() {
  return Path.join(getCacheDirectory(), 'secret-agent', 'replay');
}

export { version };

export function isBinaryInstalled() {
  try {
    const installedVersion = Fs.readFileSync(`${getInstallDirectory()}/version`, 'utf-8').trim();

    const comparison = Semver.compare(installedVersion, version);
    // 1 means installedVersion > version
    // -1 means installedVersion < version
    if (comparison >= 0) return true;
  } catch (ignored) {
    return false;
  }

  return Fs.existsSync(getBinaryPath());
}

export function recordVersion() {
  Fs.writeFileSync(`${getInstallDirectory()}/version`, version);
}

export function getBinaryPath() {
  const platformPath = getPlatformExecutable();
  return Path.join(getInstallDirectory(), platformPath);
}

function getPlatformExecutable() {
  const platform = process.env.npm_config_platform || os.platform();

  switch (platform) {
    case 'mas':
    case 'darwin':
      return 'SecretAgentReplay.app/Contents/MacOS/SecretAgentReplay';
    case 'freebsd':
    case 'openbsd':
    case 'linux':
      return `replay-${version}-linux/secretagentreplay`;
    case 'win32':
      return `replay-${version}-win/SecretAgentReplay.exe`;
    default:
      throw new Error(`SecretAgent Replay builds are not available on platform: ${platform}`);
  }
}

function getCacheDirectory(): string {
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
