import Os from 'os';
import Fs from 'fs';
import IPolyfillSet from '@secret-agent/emulators/interfaces/IPolyfillSet';
const platform = Os.platform();

export default function readPolyfills(dirname: string): IPolyfillSet | null {
  let platformDir = '';
  if (platform === 'darwin') {
    platformDir = 'mac';
  } else if (platform === 'win32') {
    platformDir = 'windows';
  } else if (platform === 'linux') {
    platformDir = 'linux';
  }

  const polyfillsDir = `${dirname}/${platformDir}`;
  if (!platformDir || !Fs.existsSync(polyfillsDir)) {
    return null;
  }

  const polyFills: IPolyfillSet = {
    get(plugin) {
      const userAgent = plugin.userAgent;
      if (userAgent.os.family === 'Windows') {
        if (userAgent.os.major === '10') {
          return this.windows10;
        }
        if (userAgent.os.major === '8') {
          return this.windows8_1;
        }
        return this.windows7;
      }
      return this.mac;
    },
    canPolyfill(plugin) {
      return !!this.get(plugin);
    },
  };

  for (const filename of Fs.readdirSync(polyfillsDir)) {
    if (!filename.startsWith('polyfill')) continue;

    const data = JSON.parse(Fs.readFileSync(`${polyfillsDir}/${filename}`, 'utf8'));

    if (filename.includes('windows-7')) {
      polyFills.windows7 = data;
    } else if (filename.includes('windows-8')) {
      polyFills.windows8_1 = data;
    } else if (filename.includes('windows-10')) {
      polyFills.windows10 = data;
    } else if (filename.includes('mac')) {
      polyFills.mac = data;
    }
  }
  return polyFills;
}
