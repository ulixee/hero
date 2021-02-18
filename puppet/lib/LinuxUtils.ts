import { exec } from 'child_process';
import { promises as Fs } from 'fs';

const osReleaseValuesByKey = new Map<string, string>();

export async function isDebianFlavor(): Promise<boolean> {
  const valuesByKey = await getLinuxOsRelease();
  if (!valuesByKey) return false;
  return (
    valuesByKey.get('id_like').includes('debian') || (await existsAsync(`/etc/debian_version`))
  );
}

export async function isFedoraFlavor(): Promise<boolean> {
  const valuesByKey = await getLinuxOsRelease();
  if (!valuesByKey) return false;
  return (
    valuesByKey.get('id_like').includes('fedora') ||
    (await existsAsync(`/etc/redhat-release`)) ||
    (await existsAsync(`/etc/SuSE-release`))
  );
}

export async function getLinuxOsRelease(): Promise<Map<string, string>> {
  if (process.platform !== 'linux') return null;
  if (osReleaseValuesByKey.size) return osReleaseValuesByKey;

  const osReleaseText = await new Promise<string>((resolve, reject) => {
    exec('cat /etc/*-release', { encoding: 'utf8' }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });

  for (const line of osReleaseText.split('\n')) {
    const tokens = line.split('=');
    const name = tokens.shift();
    let value = tokens.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
    if (!name) continue;
    osReleaseValuesByKey.set(name.toLowerCase(), value);
  }
  return osReleaseValuesByKey;
}

async function existsAsync(path: string): Promise<boolean> {
  try {
    await Fs.access(path);
    return true;
  } catch (_) {
    return false;
  }
}
