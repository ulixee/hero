import Path from 'path';
import Fs from 'fs';
import * as os from 'os';
import packageJson from './package.json';

const { version } = packageJson;

const distDir = Path.join(__dirname, 'dist');

export { version, distDir };

export function isBinaryInstalled() {
  try {
    if (Fs.readFileSync(`${distDir}/version`, 'utf-8').trim() !== version) {
      return false;
    }
  } catch (ignored) {
    return false;
  }

  return Fs.existsSync(getBinaryPath());
}

export function recordVersion() {
  Fs.writeFileSync(`${distDir}/version`, version);
}

export function getBinaryPath() {
  const platformPath = getPlatformExecutable();
  return Path.join(distDir, platformPath);
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
