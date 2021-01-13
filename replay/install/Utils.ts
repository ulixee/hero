import * as Path from 'path';
import * as Fs from 'fs';
import * as os from 'os';
import * as compareVersions from 'compare-versions';

const packageJson = require('../package.json');

const { version } = packageJson;

export function getInstallDirectory() {
  return Path.join(getCacheDirectory(), 'secret-agent', 'replay');
}

export { version };

export function isBinaryInstalled() {
  try {
    const installedVersion = Fs.readFileSync(`${getInstallDirectory()}/version`, 'utf-8').trim();
    const isCurrentVersionValid = compareVersions.compare(installedVersion, version, '>=');
    if (isCurrentVersionValid) return true;
  } catch (ignored) {
    return false;
  }

  return Fs.existsSync(getBinaryPath());
}

export function recordVersion() {
  Fs.writeFileSync(`${getInstallDirectory()}/version`, version);
}

export function isLocalBuildPresent() {
  return Fs.existsSync(getLocalBuildPath());
}

export function getLocalBuildPath() {
  const platformPath = getPlatformExecutable();

  const distDir = Path.join(__dirname, '..', 'dist', getDistDir());

  return Path.join(distDir, platformPath);
}

function getDistDir() {
  const platform = process.env.npm_config_platform || os.platform();

  switch (platform) {
    case 'mas':
    case 'darwin':
      return 'mac';
    case 'freebsd':
    case 'openbsd':
    case 'linux':
      return `linux-unpacked`;
    case 'win32':
      return `win-unpacked`;
    default:
      return '';
  }
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
